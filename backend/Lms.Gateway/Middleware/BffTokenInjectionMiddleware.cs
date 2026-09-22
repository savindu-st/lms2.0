using System.IdentityModel.Tokens.Jwt;
using Lms.Gateway.Models;
using Lms.Gateway.Services;

namespace Lms.Gateway.Middleware;

public class BffTokenInjectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly TokenEncryptionService _encryptionService;
    private readonly TokenRefreshCoordinator _refreshCoordinator;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<BffTokenInjectionMiddleware> _logger;
    private static readonly JwtSecurityTokenHandler JwtHandler = new();

    public BffTokenInjectionMiddleware(
        RequestDelegate next,
        TokenEncryptionService encryptionService,
        TokenRefreshCoordinator refreshCoordinator,
        IConfiguration configuration,
        IWebHostEnvironment env,
        ILogger<BffTokenInjectionMiddleware> logger)
    {
        _next = next;
        _encryptionService = encryptionService;
        _refreshCoordinator = refreshCoordinator;
        _configuration = configuration;
        _env = env;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var isHttps = context.Request.IsHttps || _env.IsProduction();

        if (context.Request.Cookies.TryGetValue("lms_session", out var encryptedSession) &&
            !string.IsNullOrWhiteSpace(encryptedSession))
        {
            var session = _encryptionService.DecryptSession(encryptedSession);
            if (session != null && !string.IsNullOrWhiteSpace(session.AccessToken))
            {
                var needsRefresh = IsTokenExpiredOrNearExpiry(session.AccessToken, TimeSpan.FromMinutes(2));

                if (!needsRefresh)
                {
                    context.Request.Headers.Authorization = $"Bearer {session.AccessToken}";
                }
                else if (!string.IsNullOrWhiteSpace(session.RefreshToken))
                {
                    var backendUrl = _configuration["ReverseProxy:Clusters:backend-api:Destinations:api-instance:Address"] 
                                     ?? "http://localhost:5001";

                    var (success, newSession, error) = await _refreshCoordinator.RefreshSessionAsync(session, backendUrl);
                    if (success && newSession != null)
                    {
                        context.Request.Headers.Authorization = $"Bearer {newSession.AccessToken}";

                        var newEncrypted = _encryptionService.EncryptSession(newSession);
                        context.Response.Cookies.Append("lms_session", newEncrypted, new CookieOptions
                        {
                            HttpOnly = true,
                            SameSite = SameSiteMode.Lax,
                            Secure = isHttps,
                            Path = "/",
                            MaxAge = TimeSpan.FromDays(7)
                        });
                    }
                    else
                    {
                        _logger.LogWarning("Auto-refreshing session failed: {Error}. Clearing session cookie.", error);
                        context.Response.Cookies.Delete("lms_session", new CookieOptions
                        {
                            Path = "/",
                            SameSite = SameSiteMode.Lax,
                            Secure = isHttps
                        });
                    }
                }
            }
        }

        await _next(context);
    }

    private static bool IsTokenExpiredOrNearExpiry(string tokenString, TimeSpan margin)
    {
        try
        {
            if (!JwtHandler.CanReadToken(tokenString)) return true;
            var jwt = JwtHandler.ReadJwtToken(tokenString);
            return jwt.ValidTo <= DateTime.UtcNow.Add(margin);
        }
        catch
        {
            return true;
        }
    }
}
