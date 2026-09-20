using Lms.Core.Enums;

namespace Lms.Core.Entities;

public class Enrollment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public User? Student { get; set; }
    public Guid CourseId { get; set; }
    public Course? Course { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;
    public decimal ProgressPercentage { get; set; } = 0;

    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    public int DaysRemaining => Math.Max(0, (int)Math.Ceiling((ExpiresAt - DateTime.UtcNow).TotalDays));
}
