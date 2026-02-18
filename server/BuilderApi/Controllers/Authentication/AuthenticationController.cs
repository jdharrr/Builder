using AuthenticationServices;
using AuthenticationServices.Requests;
using AuthenticationServices.Responses;
using BuilderRepositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BuilderServices;

namespace BuilderApi.Controllers.Authentication;

[ApiController]
[Route("api/auth")]
public class AuthenticationController(
    AuthenticationService authService,
    ValidatorService validatorService
) : ControllerBase
{
    private readonly string _genericProblemResponse = "An error occurred while processing the request.";
    
    [Authorize]
    [HttpGet("validate/accessToken")]
    public IActionResult ValidateAccessToken()
    {
        return Ok(new ValidateAccessTokenResponse
        {
            IsValid = true
        });
    }

    [HttpPost("create/user")]
    public async Task<IActionResult> CreateUser([FromBody] NewUserRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        try
        {
            await authService.CreateNewUserAsync(request).ConfigureAwait(false);

            return Ok(new CreateUserResponse
            {
                IsCreated = true
            });
        }
        catch (DuplicateEmailException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (DuplicateUsernameException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception)
        {
            return Problem(_genericProblemResponse);
        }
    }

    [Authorize]
    [HttpDelete("delete/user")]
    public async void DeleteUser()
    {

    }

    [HttpPost("login")]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);
        
        try
        {
            return Ok(await authService.LoginAsync(request).ConfigureAwait(false));
        }
        catch (UserNotFoundException)
        {
            return Unauthorized("Email or password are incorrect.");
        }
        catch (InvalidCredentialsException)
        {
            return Unauthorized("Email or password are incorrect.");
        }
        catch (Exception)
        {
            return Problem(_genericProblemResponse);
        }
    }

    //[Authorize]
    //[HttpPost("change/password")]
    //public async Task<IActionResult> ChangePasswordAsync([FromBody] ChangePasswordRequest request)
    //{
    //    try
    //    {
    //        return Ok(await _authService.ChangePasswordAsync(request).ConfigureAwait(false));
    //    }
    //    catch (UserNotFoundException ex)
    //    {
    //        return NotFound(ex.Message);
    //    }
    //    catch (InvalidCredentialsException ex)
    //    {
    //        return Unauthorized(ex.Message);
    //    }
    //}

    //[HttpPost("forgot/password")]
    //public async Task<IActionResult> ForgotPasswordAsync([FromBody] ForgotPasswordRequest request)
    //{
    //    if (!Regex.IsMatch(request.Email, _emailPattern, RegexOptions.IgnoreCase))
    //        return BadRequest("Incorrect email format.");

    //    try
    //    {
    //        return Ok(await _authService.ForgotPasswordAsync(request).ConfigureAwait(false));
    //    }
    //    catch (UserNotFoundException ex)
    //    {
    //        return NotFound(ex.Message);
    //    }
    //    catch (Exception)
    //    {
    //        return Problem(_genericProblemResponse);
    //    }
    //}

    //[HttpPost("reset/password")]
    //public async Task<IActionResult> ResetPasswordAsync([FromBody] ResetPasswordRequest request)
    //{
    //    try
    //    {
    //        return Ok(await _authService.ResetPasswordAsync(request).ConfigureAwait(false));
    //    }
    //    catch (UserNotFoundException ex)
    //    {
    //        return NotFound(ex.Message);
    //    }
    //    catch (InvalidTokenException ex)
    //    {
    //        return Unauthorized(ex.Message);
    //    }
    //    catch (Exception)
    //    {
    //        return Problem(_genericProblemResponse);
    //    }
    //}
}
