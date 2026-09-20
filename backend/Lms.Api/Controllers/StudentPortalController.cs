using System.Security.Claims;
using Lms.Core.DTOs;
using Lms.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lms.Api.Controllers;

[ApiController]
[Route("api/student")]
[Authorize]
public class StudentPortalController : ControllerBase
{
    private readonly ICourseService _courseService;
    private readonly IEnrollmentService _enrollmentService;
    private readonly IPaymentService _paymentService;
    private readonly IAssessmentService _assessmentService;

    public StudentPortalController(
        ICourseService courseService,
        IEnrollmentService enrollmentService,
        IPaymentService paymentService,
        IAssessmentService assessmentService)
    {
        _courseService = courseService;
        _enrollmentService = enrollmentService;
        _paymentService = paymentService;
        _assessmentService = assessmentService;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(idStr) || !Guid.TryParse(idStr, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user identity.");
        }
        return userId;
    }

    [HttpGet("my-courses")]
    public async Task<ActionResult<List<EnrollmentDto>>> GetMyCourses()
    {
        var studentId = GetCurrentUserId();
        var enrollments = await _enrollmentService.GetStudentEnrollmentsAsync(studentId);
        return Ok(enrollments);
    }

    [HttpGet("courses/{courseId:guid}/learn")]
    public async Task<ActionResult<CourseDetailDto>> GetCourseClassroom(Guid courseId)
    {
        var studentId = GetCurrentUserId();
        var isValid = await _enrollmentService.IsEnrolledAndValidAsync(studentId, courseId);
        if (!isValid)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have an active enrollment for this course, or your time-limited access has expired." });
        }

        var details = await _courseService.GetCourseDetailsAsync(courseId, studentId);
        if (details == null) return NotFound(new { message = "Course not found." });

        return Ok(details);
    }

    [HttpPost("lessons/{lessonId:guid}/complete")]
    public async Task<IActionResult> MarkLessonComplete(Guid lessonId)
    {
        var studentId = GetCurrentUserId();
        var success = await _courseService.MarkLessonCompleteAsync(studentId, lessonId);
        if (!success) return BadRequest(new { message = "Could not complete lesson." });
        return Ok(new { message = "Lesson completed." });
    }

    [HttpPost("quizzes/submit")]
    public async Task<ActionResult<QuizResultDto>> SubmitQuiz([FromBody] QuizSubmitDto dto)
    {
        var studentId = GetCurrentUserId();
        try
        {
            var result = await _assessmentService.SubmitQuizAsync(studentId, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("assignments/{assignmentId:guid}/submit")]
    public async Task<ActionResult<AssignmentSubmissionDto>> SubmitAssignment(Guid assignmentId, [FromBody] SubmitAssignmentRequest request)
    {
        var studentId = GetCurrentUserId();
        try
        {
            var result = await _assessmentService.SubmitAssignmentAsync(studentId, assignmentId, request.FileUrl, request.OriginalFileName, request.Notes);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("checkout/instant")]
    public async Task<ActionResult<PaymentDto>> InstantCheckout([FromBody] InstantCheckoutDto dto)
    {
        var studentId = GetCurrentUserId();
        try
        {
            var payment = await _paymentService.ProcessInstantCheckoutAsync(studentId, dto);
            return Ok(payment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("checkout/bank-transfer")]
    public async Task<ActionResult<PaymentDto>> SubmitBankTransfer([FromBody] BankTransferSubmitDto dto)
    {
        var studentId = GetCurrentUserId();
        try
        {
            var payment = await _paymentService.SubmitBankTransferAsync(studentId, dto);
            return Ok(payment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("invoices")]
    public async Task<ActionResult<List<InvoiceDto>>> GetMyInvoices()
    {
        var studentId = GetCurrentUserId();
        var invoices = await _paymentService.GetStudentInvoicesAsync(studentId);
        return Ok(invoices);
    }

    [HttpGet("invoices/{invoiceId:guid}")]
    public async Task<ActionResult<InvoiceDto>> GetInvoice(Guid invoiceId)
    {
        var studentId = GetCurrentUserId();
        var invoice = await _paymentService.GetInvoiceDetailsAsync(invoiceId, studentId);
        if (invoice == null) return NotFound(new { message = "Invoice not found." });
        return Ok(invoice);
    }

    [HttpGet("bank-details")]
    [AllowAnonymous]
    public ActionResult<BankDetailsDto> GetBankDetails()
    {
        return Ok(_paymentService.GetBankDetails());
    }
}

public class SubmitAssignmentRequest
{
    public string FileUrl { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
