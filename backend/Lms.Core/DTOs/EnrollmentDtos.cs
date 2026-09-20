using System.ComponentModel.DataAnnotations;
using Lms.Core.Enums;

namespace Lms.Core.DTOs;

public class EnrollmentDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string MonthYear { get; set; } = string.Empty;
    public DateTime EnrolledAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public EnrollmentStatus Status { get; set; }
    public decimal ProgressPercentage { get; set; }
    public int DaysRemaining { get; set; }
    public bool IsExpired { get; set; }
}

public class ExtendAccessDto
{
    [Range(1, 365)]
    public int AdditionalDays { get; set; } = 30;
}
