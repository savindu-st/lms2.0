namespace Lms.Core.Entities;

public class QuizAttempt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public User? Student { get; set; }
    public Guid LessonId { get; set; }
    public Lesson? Lesson { get; set; }
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public decimal Percentage { get; set; }
    public bool Passed { get; set; }
    public string UserAnswersJson { get; set; } = string.Empty; // JSON map of QuestionId -> SelectedOption
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
