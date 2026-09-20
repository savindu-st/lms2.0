using Lms.Core.Entities;
using Lms.Core.Enums;
using Lms.Infrastructure.Data;
using Lms.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Lms.Tests;

public class EnrollmentServiceTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task EnrollStudent_SetsExpiryDateCorrectly()
    {
        // Arrange
        using var context = CreateDbContext();
        var student = new User { FullName = "John Doe", Email = "john@example.com" };
        var course = new Course { Title = "Financial Accounting", AccessDurationDays = 30, Price = 100 };
        context.Users.Add(student);
        context.Courses.Add(course);
        await context.SaveChangesAsync();

        var service = new EnrollmentService(context);

        // Act
        var enrollment = await service.EnrollStudentAsync(student.Id, course.Id, 30);

        // Assert
        Assert.NotNull(enrollment);
        Assert.Equal(30, enrollment.DaysRemaining);
        Assert.False(enrollment.IsExpired);
        Assert.Equal(EnrollmentStatus.Active, enrollment.Status);
    }

    [Fact]
    public async Task IsEnrolledAndValid_ReturnsFalse_WhenExpired()
    {
        // Arrange
        using var context = CreateDbContext();
        var student = new User { FullName = "Expired Student", Email = "expired@example.com" };
        var course = new Course { Title = "Cost Accounting", AccessDurationDays = 30, Price = 100 };
        context.Users.Add(student);
        context.Courses.Add(course);
        await context.SaveChangesAsync();

        // Enrolled 40 days ago with 30 days validity -> expired 10 days ago
        var enrollment = new Enrollment
        {
            StudentId = student.Id,
            CourseId = course.Id,
            EnrolledAt = DateTime.UtcNow.AddDays(-40),
            ExpiresAt = DateTime.UtcNow.AddDays(-10),
            Status = EnrollmentStatus.Active
        };
        context.Enrollments.Add(enrollment);
        await context.SaveChangesAsync();

        var service = new EnrollmentService(context);

        // Act
        var isValid = await service.IsEnrolledAndValidAsync(student.Id, course.Id);

        // Assert
        Assert.False(isValid);
    }

    [Fact]
    public async Task ExtendAccess_AddsAdditionalDays()
    {
        // Arrange
        using var context = CreateDbContext();
        var student = new User { FullName = "Test Student", Email = "test@example.com" };
        var course = new Course { Title = "Tax Accounting", AccessDurationDays = 30, Price = 100 };
        context.Users.Add(student);
        context.Courses.Add(course);
        await context.SaveChangesAsync();

        var service = new EnrollmentService(context);
        var initial = await service.EnrollStudentAsync(student.Id, course.Id, 10);

        // Act
        var success = await service.ExtendAccessAsync(initial.Id, 20);

        // Assert
        Assert.True(success);
        var updated = await context.Enrollments.FindAsync(initial.Id);
        Assert.NotNull(updated);
        Assert.True(updated.DaysRemaining >= 29);
    }
}
