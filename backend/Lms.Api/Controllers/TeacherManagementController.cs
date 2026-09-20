using Lms.Core.DTOs;
using Lms.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lms.Api.Controllers;

[ApiController]
[Route("api/teacher/[controller]")]
[Authorize(Roles = "Teacher")]
public class TeacherManagementController : ControllerBase
{
    private readonly IEnrollmentService _enrollmentService;
    private readonly IPaymentService _paymentService;
    private readonly IAssessmentService _assessmentService;

    public TeacherManagementController(
        IEnrollmentService enrollmentService,
        IPaymentService paymentService,
        IAssessmentService assessmentService)
    {
        _enrollmentService = enrollmentService;
        _paymentService = paymentService;
        _assessmentService = assessmentService;
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<TeacherAnalyticsDto>> GetAnalytics()
    {
        var analytics = await _paymentService.GetTeacherAnalyticsAsync();
        return Ok(analytics);
    }

    [HttpGet("students")]
    public async Task<ActionResult<List<EnrollmentDto>>> GetStudentsRoster()
    {
        var roster = await _enrollmentService.GetAllStudentEnrollmentsForTeacherAsync();
        return Ok(roster);
    }

    [HttpPost("students/{enrollmentId:guid}/extend")]
    public async Task<IActionResult> ExtendAccess(Guid enrollmentId, [FromBody] ExtendAccessDto dto)
    {
        var success = await _enrollmentService.ExtendAccessAsync(enrollmentId, dto.AdditionalDays);
        if (!success) return NotFound(new { message = "Enrollment not found." });
        return Ok(new { message = $"Access extended by {dto.AdditionalDays} days." });
    }

    [HttpGet("payments/pending")]
    public async Task<ActionResult<List<PaymentDto>>> GetPendingBankTransfers()
    {
        var pending = await _paymentService.GetPendingBankTransfersAsync();
        return Ok(pending);
    }

    [HttpPost("payments/{paymentId:guid}/verify")]
    public async Task<ActionResult<PaymentDto>> VerifyBankTransfer(Guid paymentId, [FromBody] PaymentVerificationDto dto)
    {
        var verified = await _paymentService.VerifyBankTransferAsync(paymentId, dto);
        if (verified == null) return NotFound(new { message = "Payment not found." });
        return Ok(verified);
    }

    [HttpGet("submissions")]
    public async Task<ActionResult<List<AssignmentSubmissionDto>>> GetSubmissions()
    {
        var submissions = await _assessmentService.GetSubmissionsForTeacherAsync();
        return Ok(submissions);
    }

    [HttpPost("submissions/{submissionId:guid}/grade")]
    public async Task<ActionResult<AssignmentSubmissionDto>> GradeSubmission(Guid submissionId, [FromBody] GradeSubmissionDto dto)
    {
        var graded = await _assessmentService.GradeSubmissionAsync(submissionId, dto);
        if (graded == null) return NotFound(new { message = "Submission not found." });
        return Ok(graded);
    }
}
