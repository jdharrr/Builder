using BuilderServices.ExpenseCategories.ExpenseCategoryService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.ExpenseCategories.Validators;

public class UpdateCategoryNameRequestValidator : AbstractValidator<UpdateCategoryNameRequest>
{
    public UpdateCategoryNameRequestValidator()
    {
        RuleFor(x => x.CategoryId)
            .NotEmpty();

        RuleFor(x => x.NewCategoryName)
            .NotEmpty()
            .MinimumLength(2)
            .WithMessage("Category name must be greater than 2 characters")
            .MaximumLength(50)
            .WithMessage("Category name must not be greater than 50 characters");
    }
}