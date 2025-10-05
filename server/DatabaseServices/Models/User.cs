namespace DatabaseServices.Models;

public class User
{
    public int? Id { get; set; }

    public string? Username { get; set; } = string.Empty;

    public string? Email { get; set; } = string.Empty;

    public string? PasswordHash { get; set; } = string.Empty;

    public string? Salt { get; set; } = string.Empty;

    public string? PasswordResetToken { get; set; }

    public DateTime? PasswordResetExpiration { get; set; }
}