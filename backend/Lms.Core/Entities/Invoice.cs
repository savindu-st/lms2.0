namespace Lms.Core.Entities;

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PaymentId { get; set; }
    public Payment? Payment { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty; // e.g. "INV-202609-001"
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal TaxRate { get; set; } = 0.00m; // Can be configured
    public decimal TaxAmount { get; set; } = 0.00m;
    public decimal Total { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
}
