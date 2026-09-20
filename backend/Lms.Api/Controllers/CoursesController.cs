using System.Security.Claims;
using Lms.Core.DTOs;
using Lms.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CourseDto>>> GetCourses()
    {
        Guid? userId = null;
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(idStr) && Guid.TryParse(idStr, out var parsed))
        {
            userId = parsed;
        }

        var courses = await _courseService.GetAllCoursesAsync(userId, includeUnpublished: false);
        return Ok(courses);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CourseDetailDto>> GetCourse(Guid id)
    {
        Guid? userId = null;
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(idStr) && Guid.TryParse(idStr, out var parsed))
        {
            userId = parsed;
        }

        var course = await _courseService.GetCourseDetailsAsync(id, userId);
        if (course == null) return NotFound(new { message = "Course not found" });

        return Ok(course);
    }
}
