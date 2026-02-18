using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.UserService.Responses;

namespace BuilderServices.UserService;

public class UserService
{
    private readonly UserRepository _userRepo;

    private readonly UserSettingsRepository _userSettingsRepo;

    private readonly UserContext _userContext;

    public UserService(UserRepository userRepo, UserSettingsRepository userSettingsRepo, UserContext userContext)
    {
        _userRepo = userRepo;
        _userSettingsRepo = userSettingsRepo;
        _userContext = userContext;
    }

    public async Task<GetUserResponse?> GetLimitedUserByIdAsync()
    {
        var user = await _userRepo.GetLimitedUserByIdAsync(_userContext.UserId).ConfigureAwait(false);
        if (user is null)
            return null;

        return new GetUserResponse
        {
            Username = user.Username ?? string.Empty,
            Email = user.Email ?? string.Empty,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Settings = new GetUserSettingsResponse
            {
                DarkMode = user.Settings.DarkMode
            }
        };
    }

    public async Task UpdateDarkModeAsync(bool darkMode)
    {
        var updateDict = new Dictionary<string, object?>
        {
            { "dark_mode", darkMode ? 1 : 0 }
        };

        await _userSettingsRepo.UpdateUserSettings(updateDict, _userContext.UserId).ConfigureAwait(false);
    }
}
