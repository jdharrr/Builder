using BuilderServices.UserService;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers;

[ApiController]
[Route("api/user")]
public class UserController : ControllerBase
{
    private readonly UserService _service;

    public UserController(UserService service)
    {
        _service = service;
    }

    [HttpGet("")]
    public async Task<IActionResult> GetUser()
    {
        var user = await _service.GetLimitedUserByIdAsync().ConfigureAwait(false);

        return Ok(user);
    }

    [HttpPatch("update/settings/darkMode")]
    public async Task<IActionResult> UpdateDarkMode([FromBody] bool isDarkMode)
    {
        await _service.UpdateDarkModeAsync(isDarkMode).ConfigureAwait(false);

        return Ok();
    }
}