using System.Text.Json;
using Lms.Core.DTOs;
using Lms.Core.Entities;
using Lms.Core.Enums;
using Lms.Core.Interfaces;
using Lms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lms.Infrastructure.Services;

public class AssessmentService : IAssessmentService
{
    private readonly AppDbContext _context;
    private readonly ICourseService _courseService;

    public AssessmentService(AppDbContext context, ICourseService courseService)
    {
        _context = context;
        _courseService = courseService;
    }

    public async Task<QuizResultDto> SubmitQuizAsync(Guid studentId, QuizSubmitDto dto)
    {
        var questions = await _context.QuizQuestions
            .Where(q => q.LessonId == dto.LessonId)
            .OrderBy(q => q.OrderIndex)
            .ToListAsync();

        if (questions.Count == 0)
        {
            throw new InvalidOperationException("No quiz questions found for this lesson.");
        }

        int score = 0;
        int totalPoints = questions.Sum(q => q.Points);
        var reviews = new List<QuestionReviewDto>();

        foreach (var q in questions)
        {
            dto.Answers.TryGetValue(q.Id, out int selected);
            bool isCorrect = selected == q.CorrectOptionIndex;
            if (isCorrect) score += q.Points;

            reviews.Add(new QuestionReviewDto
            {
                QuestionId = q.Id,
                QuestionText = q.QuestionText,
                SelectedOptionIndex = selected,
                CorrectOptionIndex = q.CorrectOptionIndex,
                IsCorrect = isCorrect,
                Explanation = q.Explanation
            });
        }

        var percentage = totalPoints > 0 ? Math.Round(((decimal)score / totalPoints) * 100, 2) : 100;
        var passed = percentage >= 60;

        var attempt = new QuizAttempt
        {
            StudentId = studentId,
            LessonId = dto.LessonId,
            Score = score,
            TotalPoints = totalPoints,
            Percentage = percentage,
            Passed = passed,
            UserAnswersJson = JsonSerializer.Serialize(dto.Answers),
            SubmittedAt = DateTime.UtcNow
        };

        _context.QuizAttempts.Add(attempt);
        await _context.SaveChangesAsync();

        if (passed)
        {
            await _courseService.MarkLessonCompleteAsync(studentId, dto.LessonId);
        }

        return new QuizResultDto
        {
            Score = score,
            TotalPoints = totalPoints,
            Percentage = percentage,
            Passed = passed,
            QuestionReviews = reviews
        };
    }

    public async Task<QuizQuestionAdminDto> AddQuizQuestionAsync(Guid lessonId, QuizQuestionAdminDto dto)
    {
        var lesson = await _context.Lessons.FindAsync(lessonId);
        if (lesson == null) throw new KeyNotFoundException("Lesson not found.");

        var count = await _context.QuizQuestions.CountAsync(q => q.LessonId == lessonId);
        var question = new QuizQuestion
        {
            LessonId = lessonId,
            QuestionText = dto.QuestionText.Trim(),
            OptionA = dto.OptionA.Trim(),
            OptionB = dto.OptionB.Trim(),
            OptionC = dto.OptionC.Trim(),
            OptionD = dto.OptionD.Trim(),
            CorrectOptionIndex = dto.CorrectOptionIndex,
            Explanation = dto.Explanation?.Trim(),
            Points = dto.Points > 0 ? dto.Points : 1,
            OrderIndex = dto.OrderIndex > 0 ? dto.OrderIndex : count + 1
        };

        _context.QuizQuestions.Add(question);
        await _context.SaveChangesAsync();

        return new QuizQuestionAdminDto
        {
            Id = question.Id,
            LessonId = question.LessonId,
            QuestionText = question.QuestionText,
            OptionA = question.OptionA,
            OptionB = question.OptionB,
            OptionC = question.OptionC,
            OptionD = question.OptionD,
            CorrectOptionIndex = question.CorrectOptionIndex,
            Explanation = question.Explanation,
            Points = question.Points,
            OrderIndex = question.OrderIndex
        };
    }

    public async Task<bool> DeleteQuizQuestionAsync(Guid questionId)
    {
        var question = await _context.QuizQuestions.FindAsync(questionId);
        if (question == null) return false;

        _context.QuizQuestions.Remove(question);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AssignmentDto> CreateAssignmentAsync(Guid lessonId, AssignmentCreateUpdateDto dto)
    {
        var lesson = await _context.Lessons.FindAsync(lessonId);
        if (lesson == null) throw new KeyNotFoundException("Lesson not found.");

        var assignment = new Assignment
        {
            LessonId = lessonId,
            Title = dto.Title.Trim(),
            Instructions = dto.Instructions.Trim(),
            TemplateFileUrl = dto.TemplateFileUrl,
            TemplateFileName = dto.TemplateFileName,
            MaxPoints = dto.MaxPoints > 0 ? dto.MaxPoints : 100,
            DueDate = dto.DueDate
        };

        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        return new AssignmentDto
        {
            Id = assignment.Id,
            LessonId = assignment.LessonId,
            Title = assignment.Title,
            Instructions = assignment.Instructions,
            TemplateFileUrl = assignment.TemplateFileUrl,
            TemplateFileName = assignment.TemplateFileName,
            MaxPoints = assignment.MaxPoints,
            DueDate = assignment.DueDate
        };
    }

    public async Task<AssignmentSubmissionDto> SubmitAssignmentAsync(Guid studentId, Guid assignmentId, string fileUrl, string originalFileName, string? notes)
    {
        var assignment = await _context.Assignments
            .Include(a => a.Lesson)
            .FirstOrDefaultAsync(a => a.Id == assignmentId);
        if (assignment == null) throw new KeyNotFoundException("Assignment not found.");

        var existing = await _context.AssignmentSubmissions
            .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId);

        if (existing != null)
        {
            existing.SubmittedFileUrl = fileUrl;
            existing.OriginalFileName = originalFileName;
            existing.StudentNotes = notes;
            existing.SubmittedAt = DateTime.UtcNow;
            existing.Status = SubmissionStatus.Submitted;
            await _context.SaveChangesAsync();

            var student = await _context.Users.FindAsync(studentId);
            return MapSubmissionToDto(existing, assignment, student!);
        }

        var submission = new AssignmentSubmission
        {
            AssignmentId = assignmentId,
            StudentId = studentId,
            SubmittedFileUrl = fileUrl,
            OriginalFileName = originalFileName,
            StudentNotes = notes,
            Status = SubmissionStatus.Submitted,
            SubmittedAt = DateTime.UtcNow
        };

        _context.AssignmentSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        if (assignment.LessonId != Guid.Empty)
        {
            await _courseService.MarkLessonCompleteAsync(studentId, assignment.LessonId);
        }

        var studentUser = await _context.Users.FindAsync(studentId);
        return MapSubmissionToDto(submission, assignment, studentUser!);
    }

    public async Task<List<AssignmentSubmissionDto>> GetSubmissionsForTeacherAsync()
    {
        var submissions = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        return submissions.Select(s => MapSubmissionToDto(s, s.Assignment!, s.Student!)).ToList();
    }

    public async Task<AssignmentSubmissionDto?> GradeSubmissionAsync(Guid submissionId, GradeSubmissionDto dto)
    {
        var submission = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null) return null;

        submission.Score = dto.Score;
        submission.TeacherFeedback = dto.TeacherFeedback?.Trim();
        submission.Status = SubmissionStatus.Graded;
        submission.GradedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapSubmissionToDto(submission, submission.Assignment!, submission.Student!);
    }

    private static AssignmentSubmissionDto MapSubmissionToDto(AssignmentSubmission s, Assignment a, User student)
    {
        return new AssignmentSubmissionDto
        {
            Id = s.Id,
            AssignmentId = s.AssignmentId,
            AssignmentTitle = a?.Title ?? "Assignment",
            StudentId = s.StudentId,
            StudentName = student?.FullName ?? "Unknown",
            StudentEmail = student?.Email ?? "",
            SubmittedFileUrl = s.SubmittedFileUrl,
            OriginalFileName = s.OriginalFileName,
            StudentNotes = s.StudentNotes,
            Score = s.Score,
            MaxPoints = a?.MaxPoints ?? 100,
            TeacherFeedback = s.TeacherFeedback,
            Status = s.Status,
            SubmittedAt = s.SubmittedAt,
            GradedAt = s.GradedAt
        };
    }
}
