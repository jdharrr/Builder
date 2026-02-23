using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.UserService.Responses;

namespace BuilderServices.UserService;

public class UserService(UserRepository userRepo, UserSettingsRepository userSettingsRepo, UserContext userContext)
{
    #region Public service Methods
    
    public async Task<GetUserResponse?> GetLimitedUserByIdAsync()
    {
        var user = await userRepo.GetLimitedUserByIdAsync(userContext.UserId).ConfigureAwait(false);
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

        await userSettingsRepo.UpdateUserSettings(updateDict, userContext.UserId).ConfigureAwait(false);
    }
    
    #endregion
}
