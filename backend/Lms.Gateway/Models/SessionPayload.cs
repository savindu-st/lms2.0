namespace Lms.Gateway.Models;

public class SessionPayload
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}
