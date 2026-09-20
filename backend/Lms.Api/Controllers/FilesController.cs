using Lms.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _fileStorageService;

    public FilesController(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService;
    }

    [HttpPost("upload")]
    [Authorize]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50MB
    public async Task<ActionResult> UploadFile([FromForm] FileUploadDto dto)
    {
        var file = dto.File;
        var category = dto.Category;
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file was uploaded." });
        }

        var validCategory = category?.ToLowerInvariant() switch
        {
            "slips" => "slips",
            "materials" => "materials",
            "submissions" => "submissions",
            _ => "general"
        };

        using var stream = file.OpenReadStream();
        var (fileUrl, originalName) = await _fileStorageService.SaveFileAsync(stream, file.FileName, validCategory);

        return Ok(new
        {
            fileUrl,
            originalName,
            size = file.Length,
            contentType = file.ContentType
        });
    }
}

public class FileUploadDto
{
    public IFormFile File { get; set; } = null!;
    public string? Category { get; set; }
}
