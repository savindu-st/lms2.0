using Lms.Core.DTOs;
using Lms.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lms.Api.Controllers;

[ApiController]
[Route("api/teacher/[controller]")]
[Authorize(Roles = "Teacher")]
public class TeacherCoursesController : ControllerBase
{
    private readonly ICourseService _courseService;
    private readonly IAssessmentService _assessmentService;

    public TeacherCoursesController(ICourseService courseService, IAssessmentService assessmentService)
    {
        _courseService = courseService;
        _assessmentService = assessmentService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CourseDto>>> GetAllTeacherCourses()
    {
        var courses = await _courseService.GetAllCoursesAsync(null, includeUnpublished: true);
        return Ok(courses);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CourseDetailDto>> GetTeacherCourseDetails(Guid id)
    {
        var course = await _courseService.GetCourseDetailsAsync(id, null);
        if (course == null) return NotFound(new { message = "Course not found" });
        return Ok(course);
    }

    [HttpPost]
    public async Task<ActionResult<CourseDto>> CreateCourse([FromBody] CourseCreateUpdateDto dto)
    {
        var created = await _courseService.CreateCourseAsync(dto);
        return CreatedAtAction(nameof(GetTeacherCourseDetails), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CourseDto>> UpdateCourse(Guid id, [FromBody] CourseCreateUpdateDto dto)
    {
        var updated = await _courseService.UpdateCourseAsync(id, dto);
        if (updated == null) return NotFound(new { message = "Course not found" });
        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCourse(Guid id)
    {
        var success = await _courseService.DeleteCourseAsync(id);
        if (!success) return NotFound(new { message = "Course not found" });
        return NoContent();
    }

    // Module management
    [HttpPost("{courseId:guid}/modules")]
    public async Task<ActionResult<ModuleDto>> AddModule(Guid courseId, [FromBody] ModuleCreateUpdateDto dto)
    {
        try
        {
            var module = await _courseService.AddModuleAsync(courseId, dto);
            return Ok(module);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("modules/{moduleId:guid}")]
    public async Task<IActionResult> DeleteModule(Guid moduleId)
    {
        var success = await _courseService.DeleteModuleAsync(moduleId);
        if (!success) return NotFound(new { message = "Module not found" });
        return NoContent();
    }

    // Lesson management
    [HttpPost("modules/{moduleId:guid}/lessons")]
    public async Task<ActionResult<LessonDto>> AddLesson(Guid moduleId, [FromBody] LessonCreateUpdateDto dto)
    {
        try
        {
            var lesson = await _courseService.AddLessonAsync(moduleId, dto);
            return Ok(lesson);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("lessons/{lessonId:guid}")]
    public async Task<ActionResult<LessonDto>> UpdateLesson(Guid lessonId, [FromBody] LessonCreateUpdateDto dto)
    {
        var updated = await _courseService.UpdateLessonAsync(lessonId, dto);
        if (updated == null) return NotFound(new { message = "Lesson not found" });
        return Ok(updated);
    }

    [HttpDelete("lessons/{lessonId:guid}")]
    public async Task<IActionResult> DeleteLesson(Guid lessonId)
    {
        var success = await _courseService.DeleteLessonAsync(lessonId);
        if (!success) return NotFound(new { message = "Lesson not found" });
        return NoContent();
    }

    // Quiz Questions
    [HttpPost("lessons/{lessonId:guid}/quiz-questions")]
    public async Task<ActionResult<QuizQuestionAdminDto>> AddQuizQuestion(Guid lessonId, [FromBody] QuizQuestionAdminDto dto)
    {
        try
        {
            var created = await _assessmentService.AddQuizQuestionAsync(lessonId, dto);
            return Ok(created);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("quiz-questions/{questionId:guid}")]
    public async Task<IActionResult> DeleteQuizQuestion(Guid questionId)
    {
        var success = await _assessmentService.DeleteQuizQuestionAsync(questionId);
        if (!success) return NotFound(new { message = "Question not found" });
        return NoContent();
    }

    // Assignments
    [HttpPost("lessons/{lessonId:guid}/assignments")]
    public async Task<ActionResult<AssignmentDto>> CreateAssignment(Guid lessonId, [FromBody] AssignmentCreateUpdateDto dto)
    {
        try
        {
            var created = await _assessmentService.CreateAssignmentAsync(lessonId, dto);
            return Ok(created);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
