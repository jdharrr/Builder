using BuilderServices.ExpenseCategories.ExpenseCategoryService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.ExpenseCategories.Validators;

public class SetExpenseCategoryActiveStatusRequestValidator : AbstractValidator<SetExpenseCategoryActiveStatusRequest>
{
    public SetExpenseCategoryActiveStatusRequestValidator()
    {
        RuleFor(x => x.Active)
            .NotNull();
    }
}