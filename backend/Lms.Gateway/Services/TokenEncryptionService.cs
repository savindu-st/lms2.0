using System.Text.Json;
using Lms.Gateway.Models;
using Microsoft.AspNetCore.DataProtection;

namespace Lms.Gateway.Services;

public class TokenEncryptionService
{
    private readonly IDataProtector _protector;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public TokenEncryptionService(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("Lms.Bff.SessionProtector.v1");
    }

    public string EncryptSession(SessionPayload payload)
    {
        var json = JsonSerializer.Serialize(payload, JsonOptions);
        return _protector.Protect(json);
    }

    public SessionPayload? DecryptSession(string? cipherText)
    {
        if (string.IsNullOrWhiteSpace(cipherText)) return null;
        try
        {
            var json = _protector.Unprotect(cipherText);
            return JsonSerializer.Deserialize<SessionPayload>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }
}
