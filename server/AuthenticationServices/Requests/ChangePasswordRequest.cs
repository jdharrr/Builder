namespace AuthenticationServices.Requests;

public class ChangePasswordRequest
{
    public required int UserId { get; set; }

    public required string CurrentPassword { get; set; }

    public required string NewPassword { get; set; }
}
