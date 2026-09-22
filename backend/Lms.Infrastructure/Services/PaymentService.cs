using Lms.Core.DTOs;
using Lms.Core.Entities;
using Lms.Core.Enums;
using Lms.Core.Interfaces;
using Lms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Configuration;

namespace Lms.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;
    private readonly IEnrollmentService _enrollmentService;
    private readonly IConfiguration? _configuration;

    public PaymentService(AppDbContext context, IEnrollmentService enrollmentService, IConfiguration? configuration = null)
    {
        _context = context;
        _enrollmentService = enrollmentService;
        _configuration = configuration;
    }

    public async Task<PaymentDto> SubmitBankTransferAsync(Guid studentId, BankTransferSubmitDto dto)
    {
        var student = await _context.Users.FindAsync(studentId);
        if (student == null) throw new KeyNotFoundException("Student not found.");

        var course = await _context.Courses.FindAsync(dto.CourseId);
        if (course == null) throw new KeyNotFoundException("Course not found.");

        var payment = new Payment
        {
            StudentId = studentId,
            CourseId = dto.CourseId,
            Amount = course.Price,
            Currency = "USD",
            Method = PaymentMethod.BankTransfer,
            Status = PaymentStatus.PendingVerification,
            TransactionRef = dto.TransactionRef.Trim(),
            SlipFileUrl = dto.SlipFileUrl,
            OriginalSlipFileName = dto.OriginalSlipFileName,
            TransferDate = dto.TransferDate ?? DateTime.UtcNow,
            TeacherNotes = dto.StudentNotes,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return MapToDto(payment, student, course, null);
    }

    public async Task<List<PaymentDto>> GetPendingBankTransfersAsync()
    {
        var payments = await _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Course)
            .Where(p => p.Status == PaymentStatus.PendingVerification)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return payments.Select(p => MapToDto(p, p.Student!, p.Course!, null)).ToList();
    }

    public async Task<PaymentDto?> VerifyBankTransferAsync(Guid paymentId, PaymentVerificationDto dto)
    {
        var payment = await _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Course)
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.Id == paymentId);

        if (payment == null) return null;

        if (dto.Approve)
        {
            payment.Status = PaymentStatus.Completed;
            payment.VerifiedAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(dto.TeacherNotes))
            {
                payment.TeacherNotes = dto.TeacherNotes.Trim();
            }

            // Enroll student
            await _enrollmentService.EnrollStudentAsync(payment.StudentId, payment.CourseId, payment.Course!.AccessDurationDays);

            // Create invoice if not yet existing
            if (payment.Invoice == null)
            {
                var invoice = await CreateInvoiceForPaymentAsync(payment, payment.Student!, payment.Course!);
                payment.Invoice = invoice;
            }
        }
        else
        {
            payment.Status = PaymentStatus.Rejected;
            payment.VerifiedAt = DateTime.UtcNow;
            payment.TeacherNotes = dto.TeacherNotes?.Trim() ?? "Payment slip could not be verified.";
        }

        await _context.SaveChangesAsync();
        return MapToDto(payment, payment.Student!, payment.Course!, payment.Invoice);
    }

    public async Task<List<PaymentDto>> GetStudentPaymentsAsync(Guid studentId)
    {
        var payments = await _context.Payments
            .Include(p => p.Course)
            .Include(p => p.Invoice)
            .Where(p => p.StudentId == studentId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var student = await _context.Users.FindAsync(studentId);

        return payments.Select(p => MapToDto(p, student!, p.Course!, p.Invoice)).ToList();
    }

    public async Task<List<InvoiceDto>> GetStudentInvoicesAsync(Guid studentId)
    {
        var invoices = await _context.Invoices
            .Include(i => i.Payment)
            .Where(i => i.Payment!.StudentId == studentId)
            .OrderByDescending(i => i.IssuedAt)
            .ToListAsync();

        return invoices.Select(MapInvoiceToDto).ToList();
    }

    public async Task<InvoiceDto?> GetInvoiceDetailsAsync(Guid invoiceId, Guid? studentId = null)
    {
        var query = _context.Invoices
            .Include(i => i.Payment)
            .Where(i => i.Id == invoiceId);

        if (studentId.HasValue)
        {
            query = query.Where(i => i.Payment!.StudentId == studentId.Value);
        }

        var invoice = await query.FirstOrDefaultAsync();
        return invoice == null ? null : MapInvoiceToDto(invoice);
    }

    public async Task<TeacherAnalyticsDto> GetTeacherAnalyticsAsync()
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var completedPayments = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .ToListAsync();

        var totalRevenue = completedPayments.Sum(p => p.Amount);
        var currentMonthRevenue = completedPayments
            .Where(p => p.CreatedAt >= startOfMonth)
            .Sum(p => p.Amount);

        var activeStudentsCount = await _context.Enrollments
            .Where(e => e.Status == EnrollmentStatus.Active && e.ExpiresAt > now)
            .Select(e => e.StudentId)
            .Distinct()
            .CountAsync();

        var totalCoursesCount = await _context.Courses.CountAsync();
        var pendingBankTransfersCount = await _context.Payments
            .CountAsync(p => p.Status == PaymentStatus.PendingVerification);

        var pendingSubmissionsCount = await _context.AssignmentSubmissions
            .CountAsync(s => s.Status == SubmissionStatus.Submitted);

        var recentPayments = await _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Course)
            .Include(p => p.Invoice)
            .OrderByDescending(p => p.CreatedAt)
            .Take(10)
            .ToListAsync();

        return new TeacherAnalyticsDto
        {
            TotalRevenue = totalRevenue,
            CurrentMonthRevenue = currentMonthRevenue,
            ActiveStudentsCount = activeStudentsCount,
            TotalCoursesCount = totalCoursesCount,
            PendingBankTransfersCount = pendingBankTransfersCount,
            PendingSubmissionsCount = pendingSubmissionsCount,
            RecentPayments = recentPayments.Select(p => MapToDto(p, p.Student!, p.Course!, p.Invoice)).ToList()
        };
    }

    public BankDetailsDto GetBankDetails()
    {
        if (_configuration == null) return new BankDetailsDto();

        var section = _configuration.GetSection("BankDetails");
        return new BankDetailsDto
        {
            BankName = section["BankName"] ?? _configuration["BANK_NAME"] ?? string.Empty,
            AccountHolder = section["AccountHolder"] ?? _configuration["BANK_ACCOUNT_HOLDER"] ?? string.Empty,
            AccountNumber = section["AccountNumber"] ?? _configuration["BANK_ACCOUNT_NUMBER"] ?? string.Empty,
            RoutingOrSwift = section["RoutingOrSwift"] ?? _configuration["BANK_ROUTING_OR_SWIFT"] ?? string.Empty,
            BranchName = section["BranchName"] ?? _configuration["BANK_BRANCH_NAME"] ?? string.Empty,
            TransferInstructions = section["TransferInstructions"] ?? _configuration["BANK_INSTRUCTIONS"] ?? string.Empty
        };
    }

    private async Task<Invoice> CreateInvoiceForPaymentAsync(Payment payment, User student, Course course)
    {
        var count = await _context.Invoices.CountAsync() + 1;
        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMM}-{count:D4}";

        var invoice = new Invoice
        {
            PaymentId = payment.Id,
            InvoiceNumber = invoiceNumber,
            StudentName = student.FullName,
            StudentEmail = student.Email,
            CourseTitle = course.Title,
            Subtotal = payment.Amount,
            TaxRate = 0.00m,
            TaxAmount = 0.00m,
            Total = payment.Amount,
            IssuedAt = DateTime.UtcNow
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return invoice;
    }

    private static PaymentDto MapToDto(Payment p, User student, Course course, Invoice? invoice)
    {
        return new PaymentDto
        {
            Id = p.Id,
            StudentId = p.StudentId,
            StudentName = student?.FullName ?? "Unknown",
            StudentEmail = student?.Email ?? "",
            CourseId = p.CourseId,
            CourseTitle = course?.Title ?? "Unknown",
            Amount = p.Amount,
            Currency = p.Currency,
            Method = p.Method,
            Status = p.Status,
            TransactionRef = p.TransactionRef,
            SlipFileUrl = p.SlipFileUrl,
            OriginalSlipFileName = p.OriginalSlipFileName,
            TransferDate = p.TransferDate,
            TeacherNotes = p.TeacherNotes,
            VerifiedAt = p.VerifiedAt,
            CreatedAt = p.CreatedAt,
            Invoice = invoice == null ? null : MapInvoiceToDto(invoice)
        };
    }

    private static InvoiceDto MapInvoiceToDto(Invoice i)
    {
        return new InvoiceDto
        {
            Id = i.Id,
            PaymentId = i.PaymentId,
            InvoiceNumber = i.InvoiceNumber,
            StudentName = i.StudentName,
            StudentEmail = i.StudentEmail,
            CourseTitle = i.CourseTitle,
            Subtotal = i.Subtotal,
            TaxRate = i.TaxRate,
            TaxAmount = i.TaxAmount,
            Total = i.Total,
            IssuedAt = i.IssuedAt
        };
    }
}
