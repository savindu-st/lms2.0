using System.IO;
using System.Text;
using System.Threading.Tasks;
using Lms.Gateway.Middleware;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Xunit;

namespace Lms.Tests;

public class TestWebHostEnvironment : IWebHostEnvironment
{
    public string EnvironmentName { get; set; } = "Development";
    public string ApplicationName { get; set; } = "Lms.Gateway";
    public string WebRootPath { get; set; } = string.Empty;
    public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    public string ContentRootPath { get; set; } = string.Empty;
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
}

public class CsrfMiddlewareTests
{
    private readonly IWebHostEnvironment _env = new TestWebHostEnvironment();

    [Fact]
    public async Task InvokeAsync_SafeGetMethod_SeedsXsrfCookie_AndCallsNext()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new CsrfMiddleware(next, _env);
        var context = new DefaultHttpContext();
        context.Request.Method = "GET";
        context.Request.Path = "/api/courses";

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
        var setCookieHeaders = context.Response.Headers["Set-Cookie"].ToString();
        Assert.Contains("XSRF-TOKEN=", setCookieHeaders);
    }

    [Theory]
    [InlineData("/api/auth/login")]
    [InlineData("/api/auth/register")]
    public async Task InvokeAsync_ExcludedAuthPaths_CallNextWithoutCsrf(string path)
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new CsrfMiddleware(next, _env);
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = path;

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
        Assert.NotEqual(StatusCodes.Status403Forbidden, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_MutatingPost_WithoutLmsSessionCookie_BypassesCsrf_AndCallsNext()
    {
        // Arrange (Simulates Swagger UI or API client sending Bearer token without browser session cookie)
        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new CsrfMiddleware(next, _env);
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/api/courses";
        context.Request.Headers.Authorization = "Bearer eyJhbGciOi...";

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled, "Requests without lms_session (pure Bearer/Swagger) must bypass CSRF validation");
        Assert.NotEqual(StatusCodes.Status403Forbidden, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_MutatingPost_WithLmsSession_MissingXsrfTokenHeader_Returns403()
    {
        // Arrange (Browser session making request without X-XSRF-TOKEN header)
        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new CsrfMiddleware(next, _env);
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/api/courses";
        context.Request.Headers.Cookie = "lms_session=encrypted_cookie_val; XSRF-TOKEN=valid_csrf_token";
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.False(nextCalled);
        Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.Contains("Anti-CSRF token missing", body);
    }

    [Fact]
    public async Task InvokeAsync_MutatingPost_WithLmsSession_MissingXsrfTokenCookie_Returns403()
    {
        // Arrange (Request has header but missing XSRF-TOKEN cookie)
        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new CsrfMiddleware(next, _env);
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/api/courses";
        context.Request.Headers.Cookie = "lms_session=encrypted_cookie_val";
        context.Request.Headers["X-XSRF-TOKEN"] = "token123";
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.False(nextCalled);
        Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_MutatingPost_WithLmsSession_MismatchedTokens_Returns403()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new CsrfMiddleware(next, _env);
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/api/courses";
        context.Request.Headers.Cookie = "lms_session=encrypted_cookie_val; XSRF-TOKEN=token_AAA";
        context.Request.Headers["X-XSRF-TOKEN"] = "token_BBB";
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.False(nextCalled);
        Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.Contains("Anti-CSRF token mismatch", body);
    }

    [Theory]
    [InlineData("POST")]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    [InlineData("PATCH")]
    public async Task InvokeAsync_MutatingMethods_WithLmsSession_MatchingTokens_CallsNext(string method)
    {
        // Arrange
        const string token = "secure-random-csrf-token-12345";
        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new CsrfMiddleware(next, _env);
        var context = new DefaultHttpContext();
        context.Request.Method = method;
        context.Request.Path = "/api/courses";
        context.Request.Headers.Cookie = $"lms_session=encrypted_cookie_val; XSRF-TOKEN={token}";
        context.Request.Headers["X-XSRF-TOKEN"] = token;

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
        Assert.NotEqual(StatusCodes.Status403Forbidden, context.Response.StatusCode);
    }
}
