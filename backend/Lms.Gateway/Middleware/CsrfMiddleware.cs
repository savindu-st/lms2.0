using System.Security.Cryptography;
using System.Text;

namespace Lms.Gateway.Middleware;

public class CsrfMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IWebHostEnvironment _env;

    private static readonly HashSet<string> SafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "GET", "HEAD", "OPTIONS", "TRACE"
    };

    private static readonly HashSet<string> ExcludedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/auth/login",
        "/api/auth/register"
    };

    public CsrfMiddleware(RequestDelegate next, IWebHostEnvironment env)
    {
        _next = next;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var isHttps = context.Request.IsHttps || _env.IsProduction();
        var path = context.Request.Path.Value ?? string.Empty;

        // 1. Always seed the XSRF-TOKEN cookie on safe requests if missing
        if (SafeMethods.Contains(context.Request.Method))
        {
            if (!context.Request.Cookies.ContainsKey("XSRF-TOKEN"))
            {
                var token = GenerateSecureRandomToken();
                context.Response.Cookies.Append("XSRF-TOKEN", token, new CookieOptions
                {
                    HttpOnly = false, // Must be readable by Angular HttpClient
                    SameSite = SameSiteMode.Lax,
                    Secure = isHttps,
                    Path = "/",
                    MaxAge = TimeSpan.FromDays(7)
                });
            }

            await _next(context);
            return;
        }

        // 2. Skip validation for unauthenticated auth bootstrap paths
        if (ExcludedPaths.Contains(path))
        {
            await _next(context);
            return;
        }

        // 3. Only enforce CSRF verification when request uses ambient cookie session
        if (!context.Request.Cookies.ContainsKey("lms_session"))
        {
            await _next(context);
            return;
        }

        // 4. For state-changing requests using cookie session, validate CSRF header vs cookie
        if (!context.Request.Cookies.TryGetValue("XSRF-TOKEN", out var cookieToken) ||
            !context.Request.Headers.TryGetValue("X-XSRF-TOKEN", out var headerToken) ||
            string.IsNullOrWhiteSpace(cookieToken) ||
            string.IsNullOrWhiteSpace(headerToken))
        {
            await RejectCsrfAsync(context, "Anti-CSRF token missing from request cookie or X-XSRF-TOKEN header.");
            return;
        }

        var cookieBytes = Encoding.UTF8.GetBytes(cookieToken);
        var headerBytes = Encoding.UTF8.GetBytes(headerToken.ToString());

        if (cookieBytes.Length != headerBytes.Length ||
            !CryptographicOperations.FixedTimeEquals(cookieBytes, headerBytes))
        {
            await RejectCsrfAsync(context, "Anti-CSRF token mismatch.");
            return;
        }

        await _next(context);
    }

    private static async Task RejectCsrfAsync(HttpContext context, string detail)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync($"{{\"error\":\"CSRF validation failed\",\"message\":\"{detail}\"}}");
    }

    private static string GenerateSecureRandomToken()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }
}
