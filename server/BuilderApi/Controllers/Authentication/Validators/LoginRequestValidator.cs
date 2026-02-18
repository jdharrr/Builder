using AuthenticationServices.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Authentication.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Email or password are incorrect.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Email or password are incorrect.");
    }
}