using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var contactRateLimit = new ConcurrentDictionary<string, List<DateTimeOffset>>();

builder.Services.AddHttpClient();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/hello", () => "Hello World!");

app.MapPost("/api/contact", async (
    ContactRequest request,
    HttpContext httpContext,
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    ILogger<Program> logger) =>
{
    var validationError = ContactValidation.ValidateRequest(request);
    if (validationError is not null)
    {
        return Results.BadRequest(new { message = validationError });
    }

    if (request.FormDurationMs < 2500)
    {
        return Results.BadRequest(new { message = "Submission rejected. Please try again." });
    }

    var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    var now = DateTimeOffset.UtcNow;
    var recentAttempts = contactRateLimit.GetOrAdd(ipAddress, _ => []);

    lock (recentAttempts)
    {
        recentAttempts.RemoveAll(time => (now - time).TotalMinutes > 10);
        if (recentAttempts.Count >= 5)
        {
            return Results.StatusCode(StatusCodes.Status429TooManyRequests);
        }

        recentAttempts.Add(now);
    }

    var resend = configuration.GetSection("Resend").Get<ResendOptions>() ?? new ResendOptions();
    if (string.IsNullOrWhiteSpace(resend.ApiKey) ||
        string.IsNullOrWhiteSpace(resend.ToEmail) ||
        string.IsNullOrWhiteSpace(resend.FromEmail))
    {
        logger.LogError("Resend settings are incomplete. Check Resend section.");
        return Results.BadRequest(new { message = "Email service is not configured. Set Resend:ApiKey, Resend:FromEmail, and Resend:ToEmail." });
    }

    var messageBody = new StringBuilder()
        .AppendLine($"Name: {request.Name}")
        .AppendLine($"Email: {request.Email}")
        .AppendLine($"Subject: {request.Subject}")
        .AppendLine()
        .AppendLine("Message:")
        .AppendLine(request.Message)
        .ToString();

    var payload = new ResendEmailRequest(
        resend.FromEmail,
        [resend.ToEmail],
        $"Portfolio Contact: {request.Subject}",
        messageBody,
        request.Email
    );

    try
    {
        using var client = httpClientFactory.CreateClient();
        client.BaseAddress = new Uri("https://api.resend.com/");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", resend.ApiKey);

        using var response = await client.PostAsJsonAsync("emails", payload);

        if (response.IsSuccessStatusCode)
        {
            return Results.Ok(new { message = "Message sent successfully." });
        }

        var errorText = await response.Content.ReadAsStringAsync();
        logger.LogError("Resend API error: {StatusCode} - {Error}", (int)response.StatusCode, errorText);
        return Results.Json(
            new { message = "Email provider rejected the request.", detail = errorText },
            statusCode: (int)response.StatusCode
        );
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to send contact form email through Resend.");
        return Results.StatusCode(StatusCodes.Status500InternalServerError);
    }
});

app.Run();

public partial class Program { }

static class ContactValidation
{
    public static string? ValidateRequest(ContactRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Website))
        {
            return "Submission rejected.";
        }

        var context = new ValidationContext(request);
        var errors = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(request, context, errors, true);

        return isValid ? null : errors.FirstOrDefault()?.ErrorMessage;
    }
}

sealed class ContactRequest
{
    [Required, StringLength(120, MinimumLength = 2)]
    public string Name { get; init; } = "";

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; init; } = "";

    [Required, StringLength(200, MinimumLength = 2)]
    public string Subject { get; init; } = "";

    [Required, StringLength(4000, MinimumLength = 10)]
    public string Message { get; init; } = "";

    [StringLength(200)]
    public string Website { get; init; } = "";

    [Range(0, 600000)]
    public int FormDurationMs { get; init; }
}

sealed class ResendOptions
{
    public string ApiKey { get; init; } = "";
    public string FromEmail { get; init; } = "";
    public string ToEmail { get; init; } = "";
}

sealed record ResendEmailRequest(
    [property: JsonPropertyName("from")] string From,
    [property: JsonPropertyName("to")] string[] To,
    [property: JsonPropertyName("subject")] string Subject,
    [property: JsonPropertyName("text")] string Text,
    [property: JsonPropertyName("reply_to")] string ReplyTo
);
