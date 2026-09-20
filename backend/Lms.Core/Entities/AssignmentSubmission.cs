using Lms.Core.Enums;

namespace Lms.Core.Entities;

public class AssignmentSubmission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AssignmentId { get; set; }
    public Assignment? Assignment { get; set; }
    public Guid StudentId { get; set; }
    public User? Student { get; set; }
    public string SubmittedFileUrl { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string? StudentNotes { get; set; }
    public int? Score { get; set; }
    public string? TeacherFeedback { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? GradedAt { get; set; }
}
