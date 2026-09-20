using Lms.Core.Enums;

namespace Lms.Core.Entities;

public class Lesson
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ModuleId { get; set; }
    public CourseModule? Module { get; set; }
    public string Title { get; set; } = string.Empty;
    public LessonContentType ContentType { get; set; } = LessonContentType.Video;
    public string? VideoUrl { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public string? ContentText { get; set; }
    public int? DurationMinutes { get; set; }
    public int OrderIndex { get; set; }

    public ICollection<QuizQuestion> QuizQuestions { get; set; } = new List<QuizQuestion>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<LessonCompletion> Completions { get; set; } = new List<LessonCompletion>();
}
