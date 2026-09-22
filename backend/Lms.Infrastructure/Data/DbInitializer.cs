using Lms.Core.Entities;
using Lms.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;

namespace Lms.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context, IConfiguration configuration)
    {
        // 1. Ensure database tables exist
        var databaseCreator = context.Database.GetService<IDatabaseCreator>() as IRelationalDatabaseCreator;
        if (databaseCreator != null)
        {
            try
            {
                await databaseCreator.CreateTablesAsync();
            }
            catch
            {
                // Tables may already exist
            }
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        // 2. Provision Teacher Account from Configuration / Environment Variables
        var teacherEmail = configuration["Teacher:Email"] ?? configuration["TEACHER_EMAIL"];
        var teacherPassword = configuration["Teacher:Password"] ?? configuration["TEACHER_PASSWORD"];
        var teacherFullName = configuration["Teacher:FullName"] ?? configuration["TEACHER_FULL_NAME"] ?? "Academy Instructor";

        if (!string.IsNullOrWhiteSpace(teacherEmail) && !string.IsNullOrWhiteSpace(teacherPassword))
        {
            var normalizedEmail = teacherEmail.Trim().ToLowerInvariant();
            var teacher = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            if (teacher != null)
            {
                // Ensure teacher role
                teacher.Role = UserRole.Teacher;

                // Sync password hash if changed in .env to prevent lockouts
                if (!BCrypt.Net.BCrypt.Verify(teacherPassword.Trim(), teacher.PasswordHash))
                {
                    teacher.PasswordHash = BCrypt.Net.BCrypt.HashPassword(teacherPassword.Trim());
                    teacher.FullName = teacherFullName.Trim();
                    await context.SaveChangesAsync();
                }
            }
            else
            {
                // Create initial Teacher account
                teacher = new User
                {
                    FullName = teacherFullName.Trim(),
                    Email = normalizedEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(teacherPassword.Trim()),
                    Role = UserRole.Teacher,
                    CreatedAt = DateTime.UtcNow
                };

                context.Users.Add(teacher);
                await context.SaveChangesAsync();
            }
        }
    }
}
