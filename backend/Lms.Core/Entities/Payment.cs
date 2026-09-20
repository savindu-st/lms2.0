using Lms.Core.Enums;

namespace Lms.Core.Entities;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public User? Student { get; set; }
    public Guid CourseId { get; set; }
    public Course? Course { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public PaymentMethod Method { get; set; } = PaymentMethod.InstantGateway;
    public PaymentStatus Status { get; set; } = PaymentStatus.Completed;
    public string TransactionRef { get; set; } = string.Empty;
    public string? SlipFileUrl { get; set; } // Uploaded image or PDF slip
    public string? OriginalSlipFileName { get; set; }
    public DateTime? TransferDate { get; set; }
    public string? TeacherNotes { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Invoice? Invoice { get; set; }
}
