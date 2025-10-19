using AuthenticationServices;
using BuilderRepositories;
using System.Security.Claims;

namespace BuilderApi.Middleware;

public class UserContextMiddleware
{
    private readonly RequestDelegate _next;
    public UserContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserContext userContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            string? userId = context.User.FindFirst("sub")?.Value
                ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                userContext.UserId = int.Parse(userId);
            } 
            else
            {
                throw new GenericException("User ID claim not found.");
            }
        }

        await _next(context);
    }
}
