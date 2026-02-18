using AuthenticationServices.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Authentication.Validators;

public class NewUserRequestValidator : AbstractValidator<NewUserRequest> 
{
    public NewUserRequestValidator() 
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .MinimumLength(2)
            .WithMessage("Username must be longer than 2 characters")
            .MaximumLength(50)
            .WithMessage("Username must not be longer than 50 characters");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Invalid email address")
            .MaximumLength(100)
            .WithMessage("Email must not be longer than 100 characters.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .WithMessage("Password must be greater than 8 characters.")
            .MaximumLength(128)
            .WithMessage("Password must not be longer than 128 characters")
            .Matches("^[A-Za-z0-9!@#$%^&*()_+\\-=[\\]{};':\"\\\\|,.<>/?`~]+$")
            .WithMessage("Password contains invalid characters.");
    }
}
