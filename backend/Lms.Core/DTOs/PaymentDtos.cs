using System.ComponentModel.DataAnnotations;
using Lms.Core.Enums;

namespace Lms.Core.DTOs;

public class InstantCheckoutDto
{
    [Required]
    public Guid CourseId { get; set; }

    [Required]
    public string CardHolderName { get; set; } = string.Empty;

    public string? CardNumberLast4 { get; set; }
}

public class BankTransferSubmitDto
{
    [Required]
    public Guid CourseId { get; set; }

    [Required]
    public string TransactionRef { get; set; } = string.Empty;

    [Required]
    public string SlipFileUrl { get; set; } = string.Empty;

    public string? OriginalSlipFileName { get; set; }

    public DateTime? TransferDate { get; set; }

    public string? StudentNotes { get; set; }
}

public class PaymentVerificationDto
{
    [Required]
    public bool Approve { get; set; }

    public string? TeacherNotes { get; set; }
}

public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public string TransactionRef { get; set; } = string.Empty;
    public string? SlipFileUrl { get; set; }
    public string? OriginalSlipFileName { get; set; }
    public DateTime? TransferDate { get; set; }
    public string? TeacherNotes { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public InvoiceDto? Invoice { get; set; }
}

public class InvoiceDto
{
    public Guid Id { get; set; }
    public Guid PaymentId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
    public DateTime IssuedAt { get; set; }
}

public class BankDetailsDto
{
    public string BankName { get; set; } = "Bank of Accounting & Finance";
    public string AccountHolder { get; set; } = "Prof. Marcus Vance, CPA";
    public string AccountNumber { get; set; } = "9820-4100-8841-2900";
    public string RoutingOrSwift { get; set; } = "BAFUS33XX";
    public string BranchName { get; set; } = "Financial District Branch";
    public string TransferInstructions { get; set; } = "Please include your Student Name and Course Code in the payment reference. Upload a photo or PDF of your transfer receipt/slip after sending.";
}

public class TeacherAnalyticsDto
{
    public decimal TotalRevenue { get; set; }
    public decimal CurrentMonthRevenue { get; set; }
    public int ActiveStudentsCount { get; set; }
    public int TotalCoursesCount { get; set; }
    public int PendingBankTransfersCount { get; set; }
    public int PendingSubmissionsCount { get; set; }
    public List<PaymentDto> RecentPayments { get; set; } = new();
}
