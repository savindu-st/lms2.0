using Lms.Core.DTOs;
using Lms.Core.Entities;
using Lms.Infrastructure.Data;
using Lms.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Lms.Tests;

public class AssessmentServiceTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task SubmitQuiz_CalculatesScoreAndPassStatus()
    {
        // Arrange
        using var context = CreateDbContext();
        var student = new User { FullName = "Quiz Taker", Email = "quiz@test.com" };
        var course = new Course { Title = "Intro Accounting", AccessDurationDays = 30 };
        var module = new CourseModule { Course = course, Title = "Module 1" };
        var lesson = new Lesson { Module = module, Title = "Accounting Quiz" };

        var q1 = new QuizQuestion
        {
            Lesson = lesson,
            QuestionText = "Is Cash a Debit balance?",
            CorrectOptionIndex = 0,
            Points = 5
        };

        var q2 = new QuizQuestion
        {
            Lesson = lesson,
            QuestionText = "Is Revenue a Credit balance?",
            CorrectOptionIndex = 1,
            Points = 5
        };

        context.Users.Add(student);
        context.Courses.Add(course);
        context.CourseModules.Add(module);
        context.Lessons.Add(lesson);
        context.QuizQuestions.AddRange(q1, q2);
        await context.SaveChangesAsync();

        var courseService = new CourseService(context);
        var assessmentService = new AssessmentService(context, courseService);

        var submitDto = new QuizSubmitDto
        {
            LessonId = lesson.Id,
            Answers = new Dictionary<Guid, int>
            {
                { q1.Id, 0 }, // Correct (+5)
                { q2.Id, 0 }  // Wrong (selected 0 instead of 1)
            }
        };

        // Act
        var result = await assessmentService.SubmitQuizAsync(student.Id, submitDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Score);
        Assert.Equal(10, result.TotalPoints);
        Assert.Equal(50.00m, result.Percentage);
        Assert.False(result.Passed); // 50% < 60%
        Assert.Equal(2, result.QuestionReviews.Count);
    }
}
