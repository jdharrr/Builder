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

    [HttpPatch("update/settings/darkMode")]
    public async Task<IActionResult> UpdateDarkMode([FromQuery] bool darkMode)
    {
        await _service.UpdateDarkModeAsync(darkMode).ConfigureAwait(false);

        return Ok();
    }
}