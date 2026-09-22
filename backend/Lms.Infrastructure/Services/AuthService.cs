using BCrypt.Net;
using Lms.Core.DTOs;
using Lms.Core.Entities;
using Lms.Core.Enums;
using Lms.Core.Interfaces;
using Lms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Configuration;

namespace Lms.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration? _configuration;

    public AuthService(AppDbContext context, ITokenService tokenService, IConfiguration? configuration = null)
    {
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var teacherEmail = _configuration?["Teacher:Email"] ?? _configuration?["TEACHER_EMAIL"];
        if (!string.IsNullOrWhiteSpace(teacherEmail) && normalizedEmail == teacherEmail.Trim().ToLowerInvariant())
        {
            throw new InvalidOperationException("This email is reserved for the academy instructor account. Instructors cannot register via this form.");
        }

        var existing = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (existing)
        {
            throw new InvalidOperationException("An account with this email address already exists.");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            PhoneNumber = dto.PhoneNumber?.Trim(),
            Role = UserRole.Student,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id);
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken.Token,
            User = MapToDto(user)
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email address or password.");
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id);
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken.Token,
            User = MapToDto(user)
        };
    }

    public async Task<TokenRefreshResponseDto> RefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new UnauthorizedAccessException("Refresh token is required.");
        }

        var existingToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (existingToken == null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        // Check if token was previously revoked
        if (existingToken.IsRevoked)
        {
            // 30-second rotation grace period defense
            var timeSinceRevoked = DateTime.UtcNow - existingToken.RevokedAt!.Value;
            if (timeSinceRevoked <= TimeSpan.FromSeconds(30) && !string.IsNullOrEmpty(existingToken.ReplacedByToken))
            {
                var replacementToken = await _context.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == existingToken.ReplacedByToken);

                if (replacementToken != null && replacementToken.IsActive)
                {
                    var graceAccessToken = _tokenService.GenerateAccessToken(existingToken.User);
                    return new TokenRefreshResponseDto
                    {
                        AccessToken = graceAccessToken,
                        RefreshToken = replacementToken.Token
                    };
                }
            }

            // Revoked beyond grace period -> potential replay attack! Invalidate all tokens for user.
            var compromisedUserTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == existingToken.UserId && rt.RevokedAt == null)
                .ToListAsync();

            foreach (var t in compromisedUserTokens)
            {
                t.RevokedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();

            throw new UnauthorizedAccessException("Refresh token compromise detected. All active sessions have been invalidated.");
        }

        if (existingToken.IsExpired)
        {
            throw new UnauthorizedAccessException("Refresh token has expired. Please sign in again.");
        }

        // Active token: Rotate token
        existingToken.RevokedAt = DateTime.UtcNow;

        var newRefreshToken = _tokenService.GenerateRefreshToken(existingToken.UserId);
        existingToken.ReplacedByToken = newRefreshToken.Token;

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync();

        var newAccessToken = _tokenService.GenerateAccessToken(existingToken.User);

        return new TokenRefreshResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken.Token
        };
    }

    public async Task<bool> RevokeTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return false;

        var token = await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);
        if (token == null || token.IsRevoked) return false;

        token.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user == null ? null : MapToDto(user);
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            PhoneNumber = user.PhoneNumber,
            CreatedAt = user.CreatedAt
        };
    }
}
