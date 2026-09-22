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

        var token = _tokenService.GenerateToken(user);
        return new AuthResponseDto
        {
            Token = token,
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

        var token = _tokenService.GenerateToken(user);
        return new AuthResponseDto
        {
            Token = token,
            User = MapToDto(user)
        };
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
