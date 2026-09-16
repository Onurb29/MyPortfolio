using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace TheAlloyDev.MyPortfolio.Tests;

public class PortfolioWebTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;

    public PortfolioWebTests(WebApplicationFactory<Program> factory)
    {
        client = factory.CreateClient();
    }

    [Theory]
    [InlineData("/", "Turning complexity")]
    [InlineData("/homelab/", "data-node=\"portainer\"")]
    public async Task Pages_AreServedAsHtml(string path, string expectedContent)
    {
        using var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains(expectedContent, await response.Content.ReadAsStringAsync());
    }

    [Theory]
    [InlineData("/styles.css", "text/css")]
    [InlineData("/tokyo-night.css", "text/css")]
    [InlineData("/architecture.css", "text/css")]
    [InlineData("/app.js", "text/javascript")]
    [InlineData("/architecture.js", "text/javascript")]
    [InlineData("/logos/github.svg", "image/svg+xml")]
    public async Task CurrentAssets_AreServed(string path, string contentType)
    {
        using var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(contentType, response.Content.Headers.ContentType?.MediaType);
        Assert.NotEmpty(await response.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task MissingAsset_ReturnsNotFound()
    {
        using var response = await client.GetAsync("/logos/does-not-exist.svg");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task HelloApi_ReturnsExpectedResponse()
    {
        Assert.Equal("Hello World!", await client.GetStringAsync("/api/hello"));
    }

    // Invalid requests must be rejected before contacting the email provider.
    [Theory]
    [InlineData("invalid-email", "", 3000)]
    [InlineData("visitor@example.com", "spam.example", 3000)]
    [InlineData("visitor@example.com", "", 100)]
    public async Task ContactApi_RejectsInvalidOrAutomatedRequests(string email, string website, int duration)
    {
        using var response = await client.PostAsJsonAsync("/api/contact", new
        {
            Name = "Test Visitor", Email = email, Subject = "Test request",
            Message = "This request must never send an email.",
            Website = website, FormDurationMs = duration
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
