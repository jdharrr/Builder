using BuilderApi.Controllers.ExpenseCategories.Validators;
using BuilderServices.UserService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Users.Validators;

public class UpdateDarkModeRequestValidator : AbstractValidator<UpdateDarkModeRequest>
{
    public UpdateDarkModeRequestValidator()
    {
        RuleFor(x => x.IsDarkMode)
            .NotEmpty();
    }
}