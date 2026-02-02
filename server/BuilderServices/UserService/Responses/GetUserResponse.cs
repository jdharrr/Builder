namespace BuilderServices.UserService.Responses;

public class GetUserResponse
{
    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string CreatedAt { get; set; } = string.Empty;

    public string UpdatedAt { get; set; } = string.Empty;

    public GetUserSettingsResponse Settings { get; set; } = new();
}

public class GetUserSettingsResponse
{
    public bool DarkMode { get; set; }
}
