using BuilderServices.ExpenseCategories.ExpenseCategoryChartService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.ExpenseCategories.Validators;

public class CategoryAvgSpentRequestValidator : AbstractValidator<CategoryAvgSpentRequest>
{
    public CategoryAvgSpentRequestValidator()
    {
        RuleFor(x => x.Year)
            .GreaterThanOrEqualTo(1000)
            .LessThanOrEqualTo(9999)
            .WithMessage("Invalid year.");
    }
}