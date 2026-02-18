using BuilderServices.Expenses.ExpenseService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Expenses.Validators;

public class CategoryBatchUpdateRequestValidator : AbstractValidator<CategoryBatchUpdateRequest>
{
    public CategoryBatchUpdateRequestValidator()
    {
        RuleFor(x => x.CategoryId)
            .GreaterThan(0);

        RuleFor(x => x.ExpenseIds)
            .NotEmpty();

        RuleForEach(x => x.ExpenseIds)
            .GreaterThan(0)
            .WithMessage("Expense ids must be positive integers.");
    }
}
