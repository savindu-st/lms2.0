using Lms.Core.DTOs;
using Lms.Core.Entities;
using Lms.Core.Enums;
using Lms.Core.Interfaces;
using Lms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lms.Infrastructure.Services;

public class EnrollmentService : IEnrollmentService
{
    private readonly AppDbContext _context;

    public EnrollmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<EnrollmentDto>> GetStudentEnrollmentsAsync(Guid studentId)
    {
        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
            .Include(e => e.Student)
            .Where(e => e.StudentId == studentId)
            .OrderByDescending(e => e.EnrolledAt)
            .ToListAsync();

        return enrollments.Select(MapToDto).ToList();
    }

    public async Task<bool> IsEnrolledAndValidAsync(Guid studentId, Guid courseId)
    {
        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);

        if (enrollment == null) return false;
        if (enrollment.Status != EnrollmentStatus.Active) return false;
        return !enrollment.IsExpired;
    }

    public async Task<EnrollmentDto> EnrollStudentAsync(Guid studentId, Guid courseId, int durationDays)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) throw new KeyNotFoundException("Course not found.");

        var existing = await _context.Enrollments
            .Include(e => e.Course)
            .Include(e => e.Student)
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);

        var now = DateTime.UtcNow;
        var validDays = durationDays > 0 ? durationDays : (course.AccessDurationDays > 0 ? course.AccessDurationDays : 30);

        if (existing != null)
        {
            // If already enrolled and not expired, extend from existing expiry; otherwise restart from now
            var baseDate = existing.ExpiresAt > now ? existing.ExpiresAt : now;
            existing.ExpiresAt = baseDate.AddDays(validDays);
            existing.Status = EnrollmentStatus.Active;
            await _context.SaveChangesAsync();
            return MapToDto(existing);
        }

        var enrollment = new Enrollment
        {
            StudentId = studentId,
            CourseId = courseId,
            EnrolledAt = now,
            ExpiresAt = now.AddDays(validDays),
            Status = EnrollmentStatus.Active,
            ProgressPercentage = 0
        };

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        // Reload navigation properties
        await _context.Entry(enrollment).Reference(e => e.Course).LoadAsync();
        await _context.Entry(enrollment).Reference(e => e.Student).LoadAsync();

        return MapToDto(enrollment);
    }

    public async Task<List<EnrollmentDto>> GetAllStudentEnrollmentsForTeacherAsync()
    {
        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
            .Include(e => e.Student)
            .OrderByDescending(e => e.EnrolledAt)
            .ToListAsync();

        return enrollments.Select(MapToDto).ToList();
    }

    public async Task<bool> ExtendAccessAsync(Guid enrollmentId, int additionalDays)
    {
        var enrollment = await _context.Enrollments.FindAsync(enrollmentId);
        if (enrollment == null) return false;

        var baseDate = enrollment.ExpiresAt > DateTime.UtcNow ? enrollment.ExpiresAt : DateTime.UtcNow;
        enrollment.ExpiresAt = baseDate.AddDays(additionalDays);
        enrollment.Status = EnrollmentStatus.Active;

        await _context.SaveChangesAsync();
        return true;
    }

    private static EnrollmentDto MapToDto(Enrollment e)
    {
        return new EnrollmentDto
        {
            Id = e.Id,
            StudentId = e.StudentId,
            StudentName = e.Student?.FullName ?? "Unknown Student",
            StudentEmail = e.Student?.Email ?? "",
            CourseId = e.CourseId,
            CourseTitle = e.Course?.Title ?? "Unknown Course",
            CourseCode = e.Course?.CourseCode ?? "",
            MonthYear = e.Course?.MonthYear ?? "",
            EnrolledAt = e.EnrolledAt,
            ExpiresAt = e.ExpiresAt,
            Status = e.Status,
            ProgressPercentage = e.ProgressPercentage,
            DaysRemaining = e.DaysRemaining,
            IsExpired = e.IsExpired
        };
    }
}
