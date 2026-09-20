using Lms.Core.DTOs;
using Lms.Core.Entities;
using Lms.Core.Enums;
using Lms.Core.Interfaces;
using Lms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lms.Infrastructure.Services;

public class CourseService : ICourseService
{
    private readonly AppDbContext _context;

    public CourseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CourseDto>> GetAllCoursesAsync(Guid? currentUserId = null, bool includeUnpublished = false)
    {
        var query = _context.Courses.AsQueryable();
        if (!includeUnpublished)
        {
            query = query.Where(c => c.IsPublished);
        }

        var courses = await query
            .Include(c => c.Modules)
                .ThenInclude(m => m.Lessons)
            .Include(c => c.Enrollments)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var enrollments = currentUserId.HasValue
            ? await _context.Enrollments
                .Where(e => e.StudentId == currentUserId.Value && e.Status == EnrollmentStatus.Active)
                .ToListAsync()
            : new List<Enrollment>();

        return courses.Select(c =>
        {
            var enrollment = enrollments.FirstOrDefault(e => e.CourseId == c.Id);
            var isEnrolled = enrollment != null && !enrollment.IsExpired;
            var lessonsCount = c.Modules.Sum(m => m.Lessons.Count);
            var activeStudents = c.Enrollments.Count(e => e.Status == EnrollmentStatus.Active && e.ExpiresAt > DateTime.UtcNow);

            return new CourseDto
            {
                Id = c.Id,
                Title = c.Title,
                CourseCode = c.CourseCode,
                Description = c.Description,
                MonthYear = c.MonthYear,
                Price = c.Price,
                AccessDurationDays = c.AccessDurationDays,
                ThumbnailUrl = c.ThumbnailUrl,
                IsPublished = c.IsPublished,
                CreatedAt = c.CreatedAt,
                ModulesCount = c.Modules.Count,
                LessonsCount = lessonsCount,
                ActiveStudentsCount = activeStudents,
                IsEnrolled = isEnrolled,
                DaysRemaining = isEnrolled ? enrollment?.DaysRemaining : null
            };
        }).ToList();
    }

    public async Task<CourseDetailDto?> GetCourseDetailsAsync(Guid courseId, Guid? currentUserId = null)
    {
        var course = await _context.Courses
            .Include(c => c.Modules.OrderBy(m => m.OrderIndex))
                .ThenInclude(m => m.Lessons.OrderBy(l => l.OrderIndex))
                    .ThenInclude(l => l.Assignments)
            .Include(c => c.Modules)
                .ThenInclude(m => m.Lessons)
                    .ThenInclude(l => l.QuizQuestions)
            .Include(c => c.Enrollments)
            .FirstOrDefaultAsync(c => c.Id == courseId);

        if (course == null) return null;

        var enrollment = currentUserId.HasValue
            ? await _context.Enrollments
                .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == currentUserId.Value && e.Status == EnrollmentStatus.Active)
            : null;

        var isEnrolled = enrollment != null && !enrollment.IsExpired;

        // Fetch completed lesson IDs for this student
        var completedLessonIds = new HashSet<Guid>();
        if (currentUserId.HasValue)
        {
            var completions = await _context.LessonCompletions
                .Where(lc => lc.StudentId == currentUserId.Value)
                .Select(lc => lc.LessonId)
                .ToListAsync();
            completedLessonIds = completions.ToHashSet();
        }

        // Submissions for this student
        var studentSubmissions = new Dictionary<Guid, AssignmentSubmissionDto>();
        if (currentUserId.HasValue)
        {
            var subs = await _context.AssignmentSubmissions
                .Include(s => s.Assignment)
                .Where(s => s.StudentId == currentUserId.Value)
                .ToListAsync();

            studentSubmissions = subs.ToDictionary(s => s.AssignmentId, s => new AssignmentSubmissionDto
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment?.Title ?? "",
                StudentId = s.StudentId,
                SubmittedFileUrl = s.SubmittedFileUrl,
                OriginalFileName = s.OriginalFileName,
                StudentNotes = s.StudentNotes,
                Score = s.Score,
                MaxPoints = s.Assignment?.MaxPoints ?? 100,
                TeacherFeedback = s.TeacherFeedback,
                Status = s.Status,
                SubmittedAt = s.SubmittedAt,
                GradedAt = s.GradedAt
            });
        }

        var modulesDto = course.Modules.OrderBy(m => m.OrderIndex).Select(m => new ModuleDto
        {
            Id = m.Id,
            CourseId = m.CourseId,
            Title = m.Title,
            OrderIndex = m.OrderIndex,
            Lessons = m.Lessons.OrderBy(l => l.OrderIndex).Select(l =>
            {
                var assignment = l.Assignments.FirstOrDefault();
                AssignmentDto? assignmentDto = null;
                if (assignment != null)
                {
                    studentSubmissions.TryGetValue(assignment.Id, out var subDto);
                    assignmentDto = new AssignmentDto
                    {
                        Id = assignment.Id,
                        LessonId = assignment.LessonId,
                        Title = assignment.Title,
                        Instructions = assignment.Instructions,
                        TemplateFileUrl = assignment.TemplateFileUrl,
                        TemplateFileName = assignment.TemplateFileName,
                        MaxPoints = assignment.MaxPoints,
                        DueDate = assignment.DueDate,
                        MySubmission = subDto
                    };
                }

                return new LessonDto
                {
                    Id = l.Id,
                    ModuleId = l.ModuleId,
                    Title = l.Title,
                    ContentType = l.ContentType,
                    VideoUrl = isEnrolled || course.Price == 0 ? l.VideoUrl : null, // preview guard
                    AttachmentUrl = isEnrolled || course.Price == 0 ? l.AttachmentUrl : null,
                    AttachmentFileName = l.AttachmentFileName,
                    ContentText = isEnrolled || course.Price == 0 ? l.ContentText : null,
                    DurationMinutes = l.DurationMinutes,
                    OrderIndex = l.OrderIndex,
                    IsCompleted = completedLessonIds.Contains(l.Id),
                    QuestionsCount = l.QuizQuestions.Count,
                    HasAssignment = assignment != null,
                    Assignment = assignmentDto,
                    QuizQuestions = (isEnrolled || course.Price == 0) && l.ContentType == LessonContentType.Quiz
                        ? l.QuizQuestions.OrderBy(q => q.OrderIndex).Select(q => new QuizQuestionDto
                        {
                            Id = q.Id,
                            LessonId = q.LessonId,
                            QuestionText = q.QuestionText,
                            OptionA = q.OptionA,
                            OptionB = q.OptionB,
                            OptionC = q.OptionC,
                            OptionD = q.OptionD,
                            Points = q.Points,
                            OrderIndex = q.OrderIndex
                        }).ToList()
                        : null
                };
            }).ToList()
        }).ToList();

        var activeStudents = course.Enrollments.Count(e => e.Status == EnrollmentStatus.Active && e.ExpiresAt > DateTime.UtcNow);

        return new CourseDetailDto
        {
            Id = course.Id,
            Title = course.Title,
            CourseCode = course.CourseCode,
            Description = course.Description,
            MonthYear = course.MonthYear,
            Price = course.Price,
            AccessDurationDays = course.AccessDurationDays,
            ThumbnailUrl = course.ThumbnailUrl,
            IsPublished = course.IsPublished,
            CreatedAt = course.CreatedAt,
            ModulesCount = course.Modules.Count,
            LessonsCount = course.Modules.Sum(m => m.Lessons.Count),
            ActiveStudentsCount = activeStudents,
            IsEnrolled = isEnrolled,
            DaysRemaining = isEnrolled ? enrollment?.DaysRemaining : null,
            Modules = modulesDto
        };
    }

    public async Task<CourseDto> CreateCourseAsync(CourseCreateUpdateDto dto)
    {
        var course = new Course
        {
            Title = dto.Title.Trim(),
            CourseCode = dto.CourseCode.Trim().ToUpperInvariant(),
            Description = dto.Description.Trim(),
            MonthYear = dto.MonthYear.Trim(),
            Price = dto.Price,
            AccessDurationDays = dto.AccessDurationDays,
            ThumbnailUrl = dto.ThumbnailUrl,
            IsPublished = dto.IsPublished,
            CreatedAt = DateTime.UtcNow
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        return new CourseDto
        {
            Id = course.Id,
            Title = course.Title,
            CourseCode = course.CourseCode,
            Description = course.Description,
            MonthYear = course.MonthYear,
            Price = course.Price,
            AccessDurationDays = course.AccessDurationDays,
            ThumbnailUrl = course.ThumbnailUrl,
            IsPublished = course.IsPublished,
            CreatedAt = course.CreatedAt
        };
    }

    public async Task<CourseDto?> UpdateCourseAsync(Guid courseId, CourseCreateUpdateDto dto)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return null;

        course.Title = dto.Title.Trim();
        course.CourseCode = dto.CourseCode.Trim().ToUpperInvariant();
        course.Description = dto.Description.Trim();
        course.MonthYear = dto.MonthYear.Trim();
        course.Price = dto.Price;
        course.AccessDurationDays = dto.AccessDurationDays;
        course.ThumbnailUrl = dto.ThumbnailUrl;
        course.IsPublished = dto.IsPublished;

        await _context.SaveChangesAsync();

        return new CourseDto
        {
            Id = course.Id,
            Title = course.Title,
            CourseCode = course.CourseCode,
            Description = course.Description,
            MonthYear = course.MonthYear,
            Price = course.Price,
            AccessDurationDays = course.AccessDurationDays,
            ThumbnailUrl = course.ThumbnailUrl,
            IsPublished = course.IsPublished,
            CreatedAt = course.CreatedAt
        };
    }

    public async Task<bool> DeleteCourseAsync(Guid courseId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return false;

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ModuleDto> AddModuleAsync(Guid courseId, ModuleCreateUpdateDto dto)
    {
        var courseExists = await _context.Courses.AnyAsync(c => c.Id == courseId);
        if (!courseExists) throw new KeyNotFoundException("Course not found.");

        var count = await _context.CourseModules.CountAsync(m => m.CourseId == courseId);
        var module = new CourseModule
        {
            CourseId = courseId,
            Title = dto.Title.Trim(),
            OrderIndex = dto.OrderIndex > 0 ? dto.OrderIndex : count + 1
        };

        _context.CourseModules.Add(module);
        await _context.SaveChangesAsync();

        return new ModuleDto
        {
            Id = module.Id,
            CourseId = module.CourseId,
            Title = module.Title,
            OrderIndex = module.OrderIndex,
            Lessons = new List<LessonDto>()
        };
    }

    public async Task<bool> DeleteModuleAsync(Guid moduleId)
    {
        var module = await _context.CourseModules.FindAsync(moduleId);
        if (module == null) return false;

        _context.CourseModules.Remove(module);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<LessonDto> AddLessonAsync(Guid moduleId, LessonCreateUpdateDto dto)
    {
        var module = await _context.CourseModules.FindAsync(moduleId);
        if (module == null) throw new KeyNotFoundException("Module not found.");

        var count = await _context.Lessons.CountAsync(l => l.ModuleId == moduleId);
        var lesson = new Lesson
        {
            ModuleId = moduleId,
            Title = dto.Title.Trim(),
            ContentType = dto.ContentType,
            VideoUrl = dto.VideoUrl,
            AttachmentUrl = dto.AttachmentUrl,
            AttachmentFileName = dto.AttachmentFileName,
            ContentText = dto.ContentText,
            DurationMinutes = dto.DurationMinutes,
            OrderIndex = dto.OrderIndex > 0 ? dto.OrderIndex : count + 1
        };

        _context.Lessons.Add(lesson);
        await _context.SaveChangesAsync();

        return new LessonDto
        {
            Id = lesson.Id,
            ModuleId = lesson.ModuleId,
            Title = lesson.Title,
            ContentType = lesson.ContentType,
            VideoUrl = lesson.VideoUrl,
            AttachmentUrl = lesson.AttachmentUrl,
            AttachmentFileName = lesson.AttachmentFileName,
            ContentText = lesson.ContentText,
            DurationMinutes = lesson.DurationMinutes,
            OrderIndex = lesson.OrderIndex
        };
    }

    public async Task<LessonDto?> UpdateLessonAsync(Guid lessonId, LessonCreateUpdateDto dto)
    {
        var lesson = await _context.Lessons.FindAsync(lessonId);
        if (lesson == null) return null;

        lesson.Title = dto.Title.Trim();
        lesson.ContentType = dto.ContentType;
        lesson.VideoUrl = dto.VideoUrl;
        lesson.AttachmentUrl = dto.AttachmentUrl;
        lesson.AttachmentFileName = dto.AttachmentFileName;
        lesson.ContentText = dto.ContentText;
        lesson.DurationMinutes = dto.DurationMinutes;
        if (dto.OrderIndex > 0) lesson.OrderIndex = dto.OrderIndex;

        await _context.SaveChangesAsync();

        return new LessonDto
        {
            Id = lesson.Id,
            ModuleId = lesson.ModuleId,
            Title = lesson.Title,
            ContentType = lesson.ContentType,
            VideoUrl = lesson.VideoUrl,
            AttachmentUrl = lesson.AttachmentUrl,
            AttachmentFileName = lesson.AttachmentFileName,
            ContentText = lesson.ContentText,
            DurationMinutes = lesson.DurationMinutes,
            OrderIndex = lesson.OrderIndex
        };
    }

    public async Task<bool> DeleteLessonAsync(Guid lessonId)
    {
        var lesson = await _context.Lessons.FindAsync(lessonId);
        if (lesson == null) return false;

        _context.Lessons.Remove(lesson);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkLessonCompleteAsync(Guid studentId, Guid lessonId)
    {
        var lesson = await _context.Lessons
            .Include(l => l.Module)
            .FirstOrDefaultAsync(l => l.Id == lessonId);
        if (lesson == null || lesson.Module == null) return false;

        var existing = await _context.LessonCompletions
            .FirstOrDefaultAsync(lc => lc.StudentId == studentId && lc.LessonId == lessonId);

        if (existing == null)
        {
            _context.LessonCompletions.Add(new LessonCompletion
            {
                StudentId = studentId,
                LessonId = lessonId,
                CompletedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        // Update enrollment progress percentage
        var courseId = lesson.Module.CourseId;
        var totalCourseLessons = await _context.Lessons
            .CountAsync(l => l.Module!.CourseId == courseId);

        if (totalCourseLessons > 0)
        {
            var completedCount = await _context.LessonCompletions
                .CountAsync(lc => lc.StudentId == studentId && lc.Lesson!.Module!.CourseId == courseId);

            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);

            if (enrollment != null)
            {
                enrollment.ProgressPercentage = Math.Round(((decimal)completedCount / totalCourseLessons) * 100, 2);
                await _context.SaveChangesAsync();
            }
        }

        return true;
    }
}
