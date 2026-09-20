using Lms.Core.DTOs;
using Lms.Core.Entities;

namespace Lms.Core.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
}

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<UserDto?> GetCurrentUserAsync(Guid userId);
}

public interface ICourseService
{
    Task<List<CourseDto>> GetAllCoursesAsync(Guid? currentUserId = null, bool includeUnpublished = false);
    Task<CourseDetailDto?> GetCourseDetailsAsync(Guid courseId, Guid? currentUserId = null);
    Task<CourseDto> CreateCourseAsync(CourseCreateUpdateDto dto);
    Task<CourseDto?> UpdateCourseAsync(Guid courseId, CourseCreateUpdateDto dto);
    Task<bool> DeleteCourseAsync(Guid courseId);

    Task<ModuleDto> AddModuleAsync(Guid courseId, ModuleCreateUpdateDto dto);
    Task<bool> DeleteModuleAsync(Guid moduleId);

    Task<LessonDto> AddLessonAsync(Guid moduleId, LessonCreateUpdateDto dto);
    Task<LessonDto?> UpdateLessonAsync(Guid lessonId, LessonCreateUpdateDto dto);
    Task<bool> DeleteLessonAsync(Guid lessonId);
    Task<bool> MarkLessonCompleteAsync(Guid studentId, Guid lessonId);
}

public interface IEnrollmentService
{
    Task<List<EnrollmentDto>> GetStudentEnrollmentsAsync(Guid studentId);
    Task<bool> IsEnrolledAndValidAsync(Guid studentId, Guid courseId);
    Task<EnrollmentDto> EnrollStudentAsync(Guid studentId, Guid courseId, int durationDays);
    Task<List<EnrollmentDto>> GetAllStudentEnrollmentsForTeacherAsync();
    Task<bool> ExtendAccessAsync(Guid enrollmentId, int additionalDays);
}

public interface IPaymentService
{
    Task<PaymentDto> ProcessInstantCheckoutAsync(Guid studentId, InstantCheckoutDto dto);
    Task<PaymentDto> SubmitBankTransferAsync(Guid studentId, BankTransferSubmitDto dto);
    Task<List<PaymentDto>> GetPendingBankTransfersAsync();
    Task<PaymentDto?> VerifyBankTransferAsync(Guid paymentId, PaymentVerificationDto dto);
    Task<List<PaymentDto>> GetStudentPaymentsAsync(Guid studentId);
    Task<List<InvoiceDto>> GetStudentInvoicesAsync(Guid studentId);
    Task<InvoiceDto?> GetInvoiceDetailsAsync(Guid invoiceId, Guid? studentId = null);
    Task<TeacherAnalyticsDto> GetTeacherAnalyticsAsync();
    BankDetailsDto GetBankDetails();
}

public interface IAssessmentService
{
    Task<QuizResultDto> SubmitQuizAsync(Guid studentId, QuizSubmitDto dto);
    Task<QuizQuestionAdminDto> AddQuizQuestionAsync(Guid lessonId, QuizQuestionAdminDto dto);
    Task<bool> DeleteQuizQuestionAsync(Guid questionId);

    Task<AssignmentDto> CreateAssignmentAsync(Guid lessonId, AssignmentCreateUpdateDto dto);
    Task<AssignmentSubmissionDto> SubmitAssignmentAsync(Guid studentId, Guid assignmentId, string fileUrl, string originalFileName, string? notes);
    Task<List<AssignmentSubmissionDto>> GetSubmissionsForTeacherAsync();
    Task<AssignmentSubmissionDto?> GradeSubmissionAsync(Guid submissionId, GradeSubmissionDto dto);
}

public interface IFileStorageService
{
    Task<(string fileUrl, string originalName)> SaveFileAsync(Stream fileStream, string fileName, string subfolder);
    bool DeleteFile(string fileUrl);
}
