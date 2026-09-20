using Lms.Core.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace Lms.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;

    public FileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<(string fileUrl, string originalName)> SaveFileAsync(Stream fileStream, string fileName, string subfolder)
    {
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var targetFolder = Path.Combine(webRoot, "uploads", subfolder);

        if (!Directory.Exists(targetFolder))
        {
            Directory.CreateDirectory(targetFolder);
        }

        var extension = Path.GetExtension(fileName);
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var destinationPath = Path.Combine(targetFolder, uniqueFileName);

        using (var output = new FileStream(destinationPath, FileMode.Create))
        {
            await fileStream.CopyToAsync(output);
        }

        var fileUrl = $"/uploads/{subfolder}/{uniqueFileName}";
        return (fileUrl, fileName);
    }

    public bool DeleteFile(string fileUrl)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(fileUrl)) return false;
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var relative = fileUrl.TrimStart('/');
            var fullPath = Path.Combine(webRoot, relative);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return true;
            }
            return false;
        }
        catch
        {
            return false;
        }
    }
}
