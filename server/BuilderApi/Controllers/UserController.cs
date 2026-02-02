using BuilderServices.UserService;
using BuilderServices.UserService.Requests;
using BuilderServices.UserService.Responses;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers;

[ApiController]
[Route("api/user")]
public class UserController(
    UserService service
) : ControllerBase
{
    [HttpGet("")]
    public async Task<IActionResult> GetUser()
    {
        var user = await service.GetLimitedUserByIdAsync().ConfigureAwait(false);

        return Ok(user);
    }

    [HttpPatch("update/settings/darkMode")]
    public async Task<IActionResult> UpdateDarkMode([FromBody] UpdateDarkModeRequest request)
    {
        await service.UpdateDarkModeAsync(request.IsDarkMode).ConfigureAwait(false);

        return Ok(new UpdateDarkModeResponse
        {
            IsUpdated = true
        });
    }
}
