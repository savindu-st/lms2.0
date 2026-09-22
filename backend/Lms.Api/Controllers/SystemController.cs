using Lms.Core.DTOs;
using Lms.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IPaymentService _paymentService;

    public SystemController(IConfiguration configuration, IPaymentService paymentService)
    {
        _configuration = configuration;
        _paymentService = paymentService;
    }

    [HttpGet("branding")]
    [AllowAnonymous]
    public ActionResult<BrandingDto> GetBranding()
    {
        var academyName = _configuration["Academy:Name"] 
            ?? _configuration["ACADEMY_NAME"] 
            ?? "Accounting Academy LMS";

        var instructorName = _configuration["Teacher:FullName"] 
            ?? _configuration["TEACHER_FULL_NAME"] 
            ?? "Academy Instructor";

        var instructorTitle = _configuration["Teacher:Title"] 
            ?? _configuration["TEACHER_TITLE"] 
            ?? "Lead Instructor & CPA";

        var bankDetails = _paymentService.GetBankDetails();

        return Ok(new BrandingDto
        {
            AcademyName = academyName,
            InstructorName = instructorName,
            InstructorTitle = instructorTitle,
            BankDetails = bankDetails
        });
    }
}
