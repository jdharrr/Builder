using BuilderServices.ExpenseCategories.ExpenseCategoryService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.ExpenseCategories.Validators;

public class CreateExpenseCategoryRequestValidator : AbstractValidator<CreateExpenseCategoryRequest>
{
    public CreateExpenseCategoryRequestValidator()
    {
        RuleFor(x => x.CategoryName)
            .NotEmpty()
            .MinimumLength(2)
            .WithMessage("Category name must be at least 2 characters")
            .MaximumLength(50)
            .WithMessage("Category name must not be greater than 50 characters");
    }
}