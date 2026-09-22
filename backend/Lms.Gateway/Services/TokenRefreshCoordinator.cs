using System.Collections.Concurrent;
using System.Net.Http.Json;
using Lms.Gateway.Models;

namespace Lms.Gateway.Services;

public class TokenRefreshCoordinator
{
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TokenRefreshCoordinator> _logger;

    public TokenRefreshCoordinator(
        IHttpClientFactory httpClientFactory,
        ILogger<TokenRefreshCoordinator> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<(bool Success, SessionPayload? NewSession, string? ErrorMessage)> RefreshSessionAsync(
        SessionPayload currentSession,
        string backendApiUrl)
    {
        var lockKey = currentSession.RefreshToken;
        var semaphore = _locks.GetOrAdd(lockKey, _ => new SemaphoreSlim(1, 1));

        await semaphore.WaitAsync();
        try
        {
            var client = _httpClientFactory.CreateClient("BackendApi");
            var refreshRequest = new { RefreshToken = currentSession.RefreshToken };
            var response = await client.PostAsJsonAsync($"{backendApiUrl.TrimEnd('/')}/api/auth/refresh", refreshRequest);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Token refresh failed with HTTP {StatusCode}: {Error}", response.StatusCode, errorContent);
                return (false, null, errorContent);
            }

            var result = await response.Content.ReadFromJsonAsync<TokenRefreshResponse>();
            if (result == null || string.IsNullOrWhiteSpace(result.AccessToken) || string.IsNullOrWhiteSpace(result.RefreshToken))
            {
                return (false, null, "Malformed response from backend refresh endpoint.");
            }

            var newSession = new SessionPayload
            {
                AccessToken = result.AccessToken,
                RefreshToken = result.RefreshToken
            };

            return (true, newSession, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during token refresh at Gateway.");
            return (false, null, ex.Message);
        }
        finally
        {
            semaphore.Release();
            _locks.TryRemove(lockKey, out _);
        }
    }

    private class TokenRefreshResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }
}
