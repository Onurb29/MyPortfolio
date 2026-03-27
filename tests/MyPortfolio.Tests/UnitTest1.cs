using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;

namespace TheAlloyDev.MyPortfolio.Tests;

public class PortfolioWebTests : IAsyncLifetime
{
    private WebApplicationFactory<Program>? _factory;
    private HttpClient? _client;

    public Task InitializeAsync()
    {
        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        _client?.Dispose();
        _factory?.Dispose();
        return Task.CompletedTask;
    }

    [Fact]
    public async Task HomePage_ReturnsSuccessStatusCode()
    {
        // Arrange & Act
        var response = await _client!.GetAsync("/");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task HomePage_ContainsNavigationMenu()
    {
        // Arrange & Act
        var response = await _client!.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("Jimmy Perron", content);
        Assert.Contains("id=\"nav\"", content);
        Assert.Contains("About Me", content);
        Assert.Contains("Projects", content);
        Assert.Contains("Skills", content);
        Assert.Contains("Contact", content);
    }

    [Fact]
    public async Task HomePage_ContainsHamburgerMenuButton()
    {
        // Arrange & Act
        var response = await _client!.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("nav-toggle", content);
        Assert.Contains("☰", content);
    }

    [Fact]
    public async Task HomePage_ContainsContactForm()
    {
        // Arrange & Act
        var response = await _client!.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("id=\"contact-form\"", content);
        Assert.Contains("id=\"name\"", content);
        Assert.Contains("id=\"email\"", content);
        Assert.Contains("id=\"message\"", content);
    }

    [Fact]
    public async Task HomePage_ContainsProjectSections()
    {
        // Arrange & Act
        var response = await _client!.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("Production Monitoring Dashboard", content);
        Assert.Contains("Industrial Data Analysis Tool", content);
        Assert.Contains("System Support and Optimization", content);
    }

    [Fact]
    public async Task HomePage_ContainsSkillsList()
    {
        // Arrange & Act
        var response = await _client!.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("HTML", content);
        Assert.Contains("CSS", content);
        Assert.Contains("JavaScript", content);
        Assert.Contains("SQL", content);
        Assert.Contains("Python", content);
    }

    [Fact]
    public async Task ApiHelloEndpoint_ReturnsHelloWorld()
    {
        // Arrange & Act
        var response = await _client!.GetAsync("/api/hello");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Hello World!", content);
    }

    [Fact]
    public async Task CssFile_IsServedSuccessfully()
    {
        // Arrange & Act
        var response = await _client!.GetAsync("/css/styles.css");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("text/css", response.Content.Headers.ContentType?.MediaType ?? "");
    }

    [Fact]
    public async Task JavaScriptFile_IsServedSuccessfully()
    {
        // Arrange & Act
        var response = await _client!.GetAsync("/js/script.js");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}


