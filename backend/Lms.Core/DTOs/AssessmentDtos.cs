using System.ComponentModel.DataAnnotations;
using Lms.Core.Enums;

namespace Lms.Core.DTOs;

public class QuizQuestionDto
{
    public Guid Id { get; set; }
    public Guid LessonId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public int Points { get; set; } = 1;
    public int OrderIndex { get; set; }
}

public class QuizQuestionAdminDto : QuizQuestionDto
{
    public int CorrectOptionIndex { get; set; }
    public string? Explanation { get; set; }
}

public class QuizSubmitDto
{
    public Guid LessonId { get; set; }
    public Dictionary<Guid, int> Answers { get; set; } = new(); // QuestionId -> SelectedOptionIndex
}

public class QuizResultDto
{
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public decimal Percentage { get; set; }
    public bool Passed { get; set; }
    public List<QuestionReviewDto> QuestionReviews { get; set; } = new();
}

public class QuestionReviewDto
{
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public int SelectedOptionIndex { get; set; }
    public int CorrectOptionIndex { get; set; }
    public bool IsCorrect { get; set; }
    public string? Explanation { get; set; }
}

public class AssignmentDto
{
    public Guid Id { get; set; }
    public Guid LessonId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public string? TemplateFileUrl { get; set; }
    public string? TemplateFileName { get; set; }
    public int MaxPoints { get; set; } = 100;
    public DateTime? DueDate { get; set; }
    public AssignmentSubmissionDto? MySubmission { get; set; }
}

public class AssignmentCreateUpdateDto
{
    [Required]
    public string Title { get; set; } = string.Empty;
    [Required]
    public string Instructions { get; set; } = string.Empty;
    public string? TemplateFileUrl { get; set; }
    public string? TemplateFileName { get; set; }
    public int MaxPoints { get; set; } = 100;
    public DateTime? DueDate { get; set; }
}

public class AssignmentSubmissionDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string SubmittedFileUrl { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string? StudentNotes { get; set; }
    public int? Score { get; set; }
    public int MaxPoints { get; set; }
    public string? TeacherFeedback { get; set; }
    public SubmissionStatus Status { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? GradedAt { get; set; }
}

public class GradeSubmissionDto
{
    [Range(0, 1000)]
    public int Score { get; set; }
    public string? TeacherFeedback { get; set; }
}
