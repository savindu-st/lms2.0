using System.Net.Http.Json;
using System.Text;
using System.Threading.RateLimiting;
using Lms.Gateway.Middleware;
using Lms.Gateway.Models;
using Lms.Gateway.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Request Limits (100MB for video/slips/materials)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 104_857_600; // 100 MB
});
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104_857_600; // 100 MB
});

// 2. Data Protection Configuration (Keys persisted to directory so sessions survive restarts)
var keysDirectory = builder.Configuration["DataProtection:KeysDirectory"] ??
    (builder.Environment.IsProduction() ? "/app/keys" : Path.Combine(builder.Environment.ContentRootPath, "temp-keys"));
Directory.CreateDirectory(keysDirectory);

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(keysDirectory))
    .SetApplicationName("LmsApp");

// 3. BFF Services & HTTP Clients
builder.Services.AddSingleton<TokenEncryptionService>();
builder.Services.AddSingleton<TokenRefreshCoordinator>();
builder.Services.AddHttpClient("BackendApi", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// 4. YARP Reverse Proxy Configuration
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// 5. Centralized CORS Policy for Angular Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 6. Edge JWT Bearer Validation
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? "AccountingLmsSuperSecretKey2026!WithHighEntropyForSecurityAndCompliance";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AccountingLms";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AccountingLmsApp";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("authenticated", policy => policy.RequireAuthenticatedUser());
});

// 7. Tiered Rate Limiting (IP Partitioned)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Strict policy for authentication / login / register
    options.AddPolicy("auth-policy", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });

    // Relaxed policy for general API operations
    options.AddPolicy("general-policy", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 120,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });
});

var app = builder.Build();

// ---------------------- Middleware Pipeline ----------------------
app.UseCors("AllowAngular");

// Handle proxy failover errors cleanly
app.Use(async (context, next) =>
{
    await next();
    if ((context.Response.StatusCode == StatusCodes.Status502BadGateway ||
         context.Response.StatusCode == StatusCodes.Status503ServiceUnavailable) &&
        !context.Response.HasStarted)
    {
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync("{\"error\":\"Gateway Unavailable\",\"message\":\"The backend LMS service is currently unreachable or starting up. Please try again shortly.\"}");
    }
});

// Anti-CSRF verification (Double-Submit Cookie)
app.UseMiddleware<CsrfMiddleware>();

// BFF Token Injection (decrypts lms_session cookie, auto-refreshes if near expiry, injects Authorization header)
app.UseMiddleware<BffTokenInjectionMiddleware>();

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Security Response Headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
    context.Response.Headers.Remove("Server");
    context.Response.Headers.Remove("X-Powered-By");
    await next();
});

// ---------------------- BFF Auth Endpoints ----------------------
app.MapPost("/api/auth/login", async (
    HttpContext context,
    IHttpClientFactory clientFactory,
    TokenEncryptionService encryptionService,
    IConfiguration config,
    IWebHostEnvironment env) =>
{
    var backendUrl = config["ReverseProxy:Clusters:backend-api:Destinations:api-instance:Address"] ?? "http://localhost:5001";
    var client = clientFactory.CreateClient("BackendApi");

    using var reader = new StreamReader(context.Request.Body);
    var bodyJson = await reader.ReadToEndAsync();
    var backendResponse = await client.PostAsync(
        $"{backendUrl.TrimEnd('/')}/api/auth/login",
        new StringContent(bodyJson, Encoding.UTF8, "application/json"));

    if (!backendResponse.IsSuccessStatusCode)
    {
        var err = await backendResponse.Content.ReadAsStringAsync();
        return Results.Content(err, "application/json", statusCode: (int)backendResponse.StatusCode);
    }

    var authResponse = await backendResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
    if (authResponse == null || string.IsNullOrWhiteSpace(authResponse.Token))
    {
        return Results.Problem("Invalid response received from authentication service.");
    }

    var isHttps = context.Request.IsHttps || env.IsProduction();

    // 1. Attach encrypted HttpOnly session cookie
    var sessionPayload = new SessionPayload
    {
        AccessToken = authResponse.Token,
        RefreshToken = authResponse.RefreshToken ?? string.Empty
    };
    var encrypted = encryptionService.EncryptSession(sessionPayload);
    context.Response.Cookies.Append("lms_session", encrypted, new CookieOptions
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Secure = isHttps,
        Path = "/",
        MaxAge = TimeSpan.FromDays(7)
    });

    // 2. Ensure XSRF-TOKEN cookie is set
    var csrfBytes = new byte[32];
    using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
    {
        rng.GetBytes(csrfBytes);
    }
    var csrfToken = Convert.ToBase64String(csrfBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    context.Response.Cookies.Append("XSRF-TOKEN", csrfToken, new CookieOptions
    {
        HttpOnly = false, // Must be readable by Angular HttpClient
        SameSite = SameSiteMode.Lax,
        Secure = isHttps,
        Path = "/",
        MaxAge = TimeSpan.FromDays(7)
    });

    // Return ONLY user object (strip token!)
    return Results.Ok(new { user = authResponse.User });
}).RequireRateLimiting("auth-policy");

app.MapPost("/api/auth/register", async (
    HttpContext context,
    IHttpClientFactory clientFactory,
    TokenEncryptionService encryptionService,
    IConfiguration config,
    IWebHostEnvironment env) =>
{
    var backendUrl = config["ReverseProxy:Clusters:backend-api:Destinations:api-instance:Address"] ?? "http://localhost:5001";
    var client = clientFactory.CreateClient("BackendApi");

    using var reader = new StreamReader(context.Request.Body);
    var bodyJson = await reader.ReadToEndAsync();
    var backendResponse = await client.PostAsync(
        $"{backendUrl.TrimEnd('/')}/api/auth/register",
        new StringContent(bodyJson, Encoding.UTF8, "application/json"));

    if (!backendResponse.IsSuccessStatusCode)
    {
        var err = await backendResponse.Content.ReadAsStringAsync();
        return Results.Content(err, "application/json", statusCode: (int)backendResponse.StatusCode);
    }

    var authResponse = await backendResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
    if (authResponse == null || string.IsNullOrWhiteSpace(authResponse.Token))
    {
        return Results.Problem("Invalid response received from registration service.");
    }

    var isHttps = context.Request.IsHttps || env.IsProduction();

    // 1. Attach encrypted HttpOnly session cookie
    var sessionPayload = new SessionPayload
    {
        AccessToken = authResponse.Token,
        RefreshToken = authResponse.RefreshToken ?? string.Empty
    };
    var encrypted = encryptionService.EncryptSession(sessionPayload);
    context.Response.Cookies.Append("lms_session", encrypted, new CookieOptions
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Secure = isHttps,
        Path = "/",
        MaxAge = TimeSpan.FromDays(7)
    });

    // 2. Ensure XSRF-TOKEN cookie is set
    var csrfBytes = new byte[32];
    using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
    {
        rng.GetBytes(csrfBytes);
    }
    var csrfToken = Convert.ToBase64String(csrfBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    context.Response.Cookies.Append("XSRF-TOKEN", csrfToken, new CookieOptions
    {
        HttpOnly = false,
        SameSite = SameSiteMode.Lax,
        Secure = isHttps,
        Path = "/",
        MaxAge = TimeSpan.FromDays(7)
    });

    return Results.Ok(new { user = authResponse.User });
}).RequireRateLimiting("auth-policy");

app.MapPost("/api/auth/logout", async (
    HttpContext context,
    IHttpClientFactory clientFactory,
    TokenEncryptionService encryptionService,
    IConfiguration config,
    IWebHostEnvironment env) =>
{
    var backendUrl = config["ReverseProxy:Clusters:backend-api:Destinations:api-instance:Address"] ?? "http://localhost:5001";
    var isHttps = context.Request.IsHttps || env.IsProduction();

    if (context.Request.Cookies.TryGetValue("lms_session", out var encrypted) && !string.IsNullOrWhiteSpace(encrypted))
    {
        var session = encryptionService.DecryptSession(encrypted);
        if (session != null && !string.IsNullOrWhiteSpace(session.RefreshToken))
        {
            try
            {
                var client = clientFactory.CreateClient("BackendApi");
                await client.PostAsJsonAsync($"{backendUrl.TrimEnd('/')}/api/auth/revoke", new { RefreshToken = session.RefreshToken });
            }
            catch
            {
                // Soft-fail revocation on network glitch; cookies will still be deleted
            }
        }
    }

    context.Response.Cookies.Delete("lms_session", new CookieOptions
    {
        Path = "/",
        SameSite = SameSiteMode.Lax,
        Secure = isHttps
    });
    context.Response.Cookies.Delete("XSRF-TOKEN", new CookieOptions
    {
        Path = "/",
        SameSite = SameSiteMode.Lax,
        Secure = isHttps
    });

    return Results.Ok(new { message = "Logged out successfully." });
});

// Map YARP Endpoints
app.MapReverseProxy();

app.Run();

// Internal DTO helper for Gateway auth deserialization
internal class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public object User { get; set; } = null!;
}
