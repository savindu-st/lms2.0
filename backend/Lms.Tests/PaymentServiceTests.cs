using Lms.Core.DTOs;
using Lms.Core.Entities;
using Lms.Core.Enums;
using Lms.Infrastructure.Data;
using Lms.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Lms.Tests;

public class PaymentServiceTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task InstantCheckout_EnrollsStudent_AndGeneratesInvoice()
    {
        // Arrange
        using var context = CreateDbContext();
        var student = new User { FullName = "Alex Reynolds", Email = "alex@test.com" };
        var course = new Course { Title = "Balance Sheet Mastery", Price = 129.00m, AccessDurationDays = 45 };
        context.Users.Add(student);
        context.Courses.Add(course);
        await context.SaveChangesAsync();

        var enrollmentService = new EnrollmentService(context);
        var paymentService = new PaymentService(context, enrollmentService);

        var checkoutDto = new InstantCheckoutDto
        {
            CourseId = course.Id,
            CardHolderName = "Alex Reynolds",
            CardNumberLast4 = "4242"
        };

        // Act
        var payment = await paymentService.ProcessInstantCheckoutAsync(student.Id, checkoutDto);

        // Assert
        Assert.NotNull(payment);
        Assert.Equal(PaymentStatus.Completed, payment.Status);
        Assert.Equal(129.00m, payment.Amount);
        Assert.NotNull(payment.Invoice);
        Assert.StartsWith("INV-", payment.Invoice.InvoiceNumber);

        // Verify active enrollment was created
        var isEnrolled = await enrollmentService.IsEnrolledAndValidAsync(student.Id, course.Id);
        Assert.True(isEnrolled);
    }

    [Fact]
    public async Task SubmitBankTransfer_CreatesPendingPayment()
    {
        // Arrange
        using var context = CreateDbContext();
        var student = new User { FullName = "Sarah Jenkins", Email = "sarah@test.com" };
        var course = new Course { Title = "Cost Analysis", Price = 149.00m, AccessDurationDays = 60 };
        context.Users.Add(student);
        context.Courses.Add(course);
        await context.SaveChangesAsync();

        var enrollmentService = new EnrollmentService(context);
        var paymentService = new PaymentService(context, enrollmentService);

        var dto = new BankTransferSubmitDto
        {
            CourseId = course.Id,
            TransactionRef = "WIRE-99201",
            SlipFileUrl = "/uploads/slips/slip.pdf",
            OriginalSlipFileName = "slip.pdf"
        };

        // Act
        var payment = await paymentService.SubmitBankTransferAsync(student.Id, dto);

        // Assert
        Assert.NotNull(payment);
        Assert.Equal(PaymentStatus.PendingVerification, payment.Status);

        // Not yet enrolled until verified
        var isEnrolled = await enrollmentService.IsEnrolledAndValidAsync(student.Id, course.Id);
        Assert.False(isEnrolled);
    }

    [Fact]
    public async Task VerifyBankTransfer_WhenApproved_EnrollsStudentAndCreatesInvoice()
    {
        // Arrange
        using var context = CreateDbContext();
        var student = new User { FullName = "Sarah Jenkins", Email = "sarah@test.com" };
        var course = new Course { Title = "Cost Analysis", Price = 149.00m, AccessDurationDays = 60 };
        context.Users.Add(student);
        context.Courses.Add(course);
        await context.SaveChangesAsync();

        var enrollmentService = new EnrollmentService(context);
        var paymentService = new PaymentService(context, enrollmentService);

        var submission = await paymentService.SubmitBankTransferAsync(student.Id, new BankTransferSubmitDto
        {
            CourseId = course.Id,
            TransactionRef = "WIRE-99201",
            SlipFileUrl = "/uploads/slips/slip.pdf"
        });

        // Act: Teacher approves
        var verified = await paymentService.VerifyBankTransferAsync(submission.Id, new PaymentVerificationDto
        {
            Approve = true,
            TeacherNotes = "Verified on Chase business statement"
        });

        // Assert
        Assert.NotNull(verified);
        Assert.Equal(PaymentStatus.Completed, verified.Status);
        Assert.NotNull(verified.Invoice);

        var isEnrolled = await enrollmentService.IsEnrolledAndValidAsync(student.Id, course.Id);
        Assert.True(isEnrolled);
    }
}
