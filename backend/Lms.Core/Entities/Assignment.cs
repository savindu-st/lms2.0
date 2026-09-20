namespace Lms.Core.Entities;

public class Assignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LessonId { get; set; }
    public Lesson? Lesson { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public string? TemplateFileUrl { get; set; } // downloadable Excel or PDF template
    public string? TemplateFileName { get; set; }
    public int MaxPoints { get; set; } = 100;
    public DateTime? DueDate { get; set; }

    public ICollection<AssignmentSubmission> Submissions { get; set; } = new List<AssignmentSubmission>();
}
