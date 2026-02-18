using BuilderServices;
using BuilderServices.UserService;
using BuilderServices.UserService.Requests;
using BuilderServices.UserService.Responses;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers.Users;

[ApiController]
[Route("api/user")]
public class UserController(
    UserService service,
    ValidatorService validatorService
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
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);
        
        await service.UpdateDarkModeAsync(request.IsDarkMode).ConfigureAwait(false);

        return Ok(new UpdateDarkModeResponse
        {
            IsUpdated = true
        });
    }
}
