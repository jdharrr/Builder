using AuthenticationServices;
using BuilderRepositories;

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

    public async Task UpdateDarkModeAsync(bool darkMode)
    {
        var updateDict = new Dictionary<string, object?>
        {
            { "dark_mode", darkMode ? 1 : 0 }
        };

        await _userSettingsRepo.UpdateUserSettings(updateDict, _userContext.UserId).ConfigureAwait(false);
    }
}
