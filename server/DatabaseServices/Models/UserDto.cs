namespace DatabaseServices.Models;

public class UserDto
{
    public int? Id { get; set; }

    public string? Username { get; set; } = string.Empty;

    public string? Email { get; set; } = string.Empty;

    public string? PasswordHash { get; set; } = string.Empty;

    public string? Salt { get; set; } = string.Empty;

    public string? PasswordResetToken { get; set; }

    public DateTime? PasswordResetExpiration { get; set; }

    public UserSettingsDto Settings { get; set; } = new UserSettingsDto();

    public string CreatedAt { get; set; } = string.Empty;

    public string UpdatedAt { get; set; } = string.Empty;
}