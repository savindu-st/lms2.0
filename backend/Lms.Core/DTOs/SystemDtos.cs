namespace Lms.Core.DTOs;

public class BrandingDto
{
    public string AcademyName { get; set; } = "Accounting Academy LMS";
    public string InstructorName { get; set; } = "Academy Instructor";
    public string InstructorTitle { get; set; } = "Lead Instructor & CPA";
    public BankDetailsDto BankDetails { get; set; } = new();
}
