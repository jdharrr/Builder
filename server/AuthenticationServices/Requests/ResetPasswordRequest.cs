namespace AuthenticationServices.Requests;

public class ResetPasswordRequest
{
    public required string NewPassword { get; set; } = string.Empty;

    public required string ResetToken { get; set; } = string.Empty;
}
