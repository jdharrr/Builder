using System.Text.Json;
using AuthenticationServices.Exceptions;
using BuilderApi.Exceptions;
using BuilderRepositories.Exceptions;

namespace BuilderApi.Middleware;

public class ApiExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ApiExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            ApiException apiEx => (apiEx.StatusCode, apiEx.Message),
            BadRequestException badRequestEx => (badRequestEx.StatusCode, badRequestEx.Message),
            DuplicateEmailException duplicateEmailEx => (StatusCodes.Status400BadRequest, duplicateEmailEx.Message),
            DuplicateUsernameException duplicateUsernameEx => (StatusCodes.Status400BadRequest, duplicateUsernameEx.Message),
            InvalidCredentialsException invalidCredentialsEx => (StatusCodes.Status401Unauthorized, invalidCredentialsEx.Message),
            GenericException genericEx => (StatusCodes.Status500InternalServerError, genericEx.Message),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred while processing the request.")
        };

        var payload = JsonSerializer.Serialize(new { message });
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;
        return context.Response.WriteAsync(payload);
    }
}
