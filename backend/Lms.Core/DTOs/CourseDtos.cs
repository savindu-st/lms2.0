using System.ComponentModel.DataAnnotations;
using Lms.Core.Enums;

namespace Lms.Core.DTOs;

public class CourseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string MonthYear { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int AccessDurationDays { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ModulesCount { get; set; }
    public int LessonsCount { get; set; }
    public int ActiveStudentsCount { get; set; }
    public bool IsEnrolled { get; set; }
    public int? DaysRemaining { get; set; }
}

public class CourseDetailDto : CourseDto
{
    public List<ModuleDto> Modules { get; set; } = new();
}

public class CourseCreateUpdateDto
{
    [Required, MinLength(3)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string CourseCode { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    public string MonthYear { get; set; } = string.Empty;

    [Range(0, 100000)]
    public decimal Price { get; set; }

    [Range(1, 365)]
    public int AccessDurationDays { get; set; } = 30;

    public string? ThumbnailUrl { get; set; }
    public bool IsPublished { get; set; } = true;
}

public class ModuleDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public List<LessonDto> Lessons { get; set; } = new();
}

public class ModuleCreateUpdateDto
{
    [Required, MinLength(2)]
    public string Title { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
}

public class LessonDto
{
    public Guid Id { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public LessonContentType ContentType { get; set; }
    public string? VideoUrl { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public string? ContentText { get; set; }
    public int? DurationMinutes { get; set; }
    public int OrderIndex { get; set; }
    public bool IsCompleted { get; set; }
    public int QuestionsCount { get; set; }
    public bool HasAssignment { get; set; }
    public AssignmentDto? Assignment { get; set; }
    public List<QuizQuestionDto>? QuizQuestions { get; set; }
}

public class LessonCreateUpdateDto
{
    [Required, MinLength(2)]
    public string Title { get; set; } = string.Empty;
    public LessonContentType ContentType { get; set; } = LessonContentType.Video;
    public string? VideoUrl { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public string? ContentText { get; set; }
    public int? DurationMinutes { get; set; }
    public int OrderIndex { get; set; }
}
