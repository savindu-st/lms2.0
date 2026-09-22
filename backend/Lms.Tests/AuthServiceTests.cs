using Lms.Core.DTOs;
using Lms.Core.Entities;
using Lms.Core.Enums;
using Lms.Infrastructure.Data;
using Lms.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Lms.Tests;

public class AuthServiceTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private TokenService CreateTokenService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Jwt:SecretKey", "SuperSecretKeyForTestingPurposesOnly1234567890!" },
                { "Jwt:Issuer", "TestIssuer" },
                { "Jwt:Audience", "TestAudience" }
            })
            .Build();
        return new TokenService(config);
    }

    [Fact]
    public async Task RegisterAndLogin_IssuesAccessTokenAndRefreshToken()
    {
        using var context = CreateDbContext();
        var tokenService = CreateTokenService();
        var authService = new AuthService(context, tokenService);

        var registerResult = await authService.RegisterAsync(new RegisterDto
        {
            FullName = "Test Student",
            Email = "student@test.com",
            Password = "Password123!"
        });

        Assert.NotEmpty(registerResult.Token);
        Assert.NotNull(registerResult.RefreshToken);
        Assert.NotEmpty(registerResult.RefreshToken);

        var loginResult = await authService.LoginAsync(new LoginDto
        {
            Email = "student@test.com",
            Password = "Password123!"
        });

        Assert.NotEmpty(loginResult.Token);
        Assert.NotNull(loginResult.RefreshToken);
        Assert.NotEqual(registerResult.RefreshToken, loginResult.RefreshToken);

        var dbTokens = await context.RefreshTokens.Where(rt => rt.UserId == loginResult.User.Id).ToListAsync();
        Assert.Equal(2, dbTokens.Count);
    }

    [Fact]
    public async Task RefreshToken_RotatesTokenAndIssuesNewPair()
    {
        using var context = CreateDbContext();
        var tokenService = CreateTokenService();
        var authService = new AuthService(context, tokenService);

        var reg = await authService.RegisterAsync(new RegisterDto
        {
            FullName = "Rotate Student",
            Email = "rotate@test.com",
            Password = "Password123!"
        });

        var initialRefreshToken = reg.RefreshToken!;
        var refreshResult = await authService.RefreshTokenAsync(initialRefreshToken);

        Assert.NotEmpty(refreshResult.AccessToken);
        Assert.NotEmpty(refreshResult.RefreshToken);
        Assert.NotEqual(initialRefreshToken, refreshResult.RefreshToken);

        var oldToken = await context.RefreshTokens.FirstAsync(rt => rt.Token == initialRefreshToken);
        Assert.NotNull(oldToken.RevokedAt);
        Assert.Equal(refreshResult.RefreshToken, oldToken.ReplacedByToken);

        var newToken = await context.RefreshTokens.FirstAsync(rt => rt.Token == refreshResult.RefreshToken);
        Assert.Null(newToken.RevokedAt);
        Assert.True(newToken.IsActive);
    }

    [Fact]
    public async Task RefreshToken_Within30SecondGracePeriod_ReturnsActiveReplacementToken()
    {
        using var context = CreateDbContext();
        var tokenService = CreateTokenService();
        var authService = new AuthService(context, tokenService);

        var reg = await authService.RegisterAsync(new RegisterDto
        {
            FullName = "Grace Student",
            Email = "grace@test.com",
            Password = "Password123!"
        });

        var initialRefreshToken = reg.RefreshToken!;
        var firstRefresh = await authService.RefreshTokenAsync(initialRefreshToken);

        // Simulate concurrent parallel request arriving with initialRefreshToken within 30s
        var concurrentRefresh = await authService.RefreshTokenAsync(initialRefreshToken);

        Assert.Equal(firstRefresh.RefreshToken, concurrentRefresh.RefreshToken);
        Assert.NotEmpty(concurrentRefresh.AccessToken);
    }

    [Fact]
    public async Task RefreshToken_ReplayedBeyondGracePeriod_RevokesAllSessions()
    {
        using var context = CreateDbContext();
        var tokenService = CreateTokenService();
        var authService = new AuthService(context, tokenService);

        var reg = await authService.RegisterAsync(new RegisterDto
        {
            FullName = "Compromise Student",
            Email = "compromise@test.com",
            Password = "Password123!"
        });

        var initialRefreshToken = reg.RefreshToken!;
        var firstRefresh = await authService.RefreshTokenAsync(initialRefreshToken);

        // Manually simulate an old token revoked 60 seconds ago
        var oldToken = await context.RefreshTokens.FirstAsync(rt => rt.Token == initialRefreshToken);
        oldToken.RevokedAt = DateTime.UtcNow.AddSeconds(-60);
        await context.SaveChangesAsync();

        // Attempting to refresh using old token should detect compromise and revoke everything
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            authService.RefreshTokenAsync(initialRefreshToken));

        var allTokens = await context.RefreshTokens.Where(rt => rt.UserId == reg.User.Id).ToListAsync();
        Assert.All(allTokens, t => Assert.NotNull(t.RevokedAt));
    }

    [Fact]
    public async Task RevokeToken_MarksTokenAsRevoked()
    {
        using var context = CreateDbContext();
        var tokenService = CreateTokenService();
        var authService = new AuthService(context, tokenService);

        var reg = await authService.RegisterAsync(new RegisterDto
        {
            FullName = "Revoke Student",
            Email = "revoke@test.com",
            Password = "Password123!"
        });

        var revoked = await authService.RevokeTokenAsync(reg.RefreshToken!);
        Assert.True(revoked);

        var tokenInDb = await context.RefreshTokens.FirstAsync(rt => rt.Token == reg.RefreshToken);
        Assert.NotNull(tokenInDb.RevokedAt);
        Assert.False(tokenInDb.IsActive);
    }
}
