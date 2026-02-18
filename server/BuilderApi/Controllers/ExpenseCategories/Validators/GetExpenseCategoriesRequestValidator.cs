using BuilderServices.ExpenseCategories.ExpenseCategoryService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.ExpenseCategories.Validators;

public class GetExpenseCategoriesRequestValidator : AbstractValidator<GetExpenseCategoriesRequest>
{
    public GetExpenseCategoriesRequestValidator()
    {
        RuleFor(x => x.Active)
            .NotNull();
    }
}