namespace Lms.Core.Entities;

public class QuizQuestion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LessonId { get; set; }
    public Lesson? Lesson { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public int CorrectOptionIndex { get; set; } // 0=A, 1=B, 2=C, 3=D
    public string? Explanation { get; set; }
    public int Points { get; set; } = 1;
    public int OrderIndex { get; set; }
}
