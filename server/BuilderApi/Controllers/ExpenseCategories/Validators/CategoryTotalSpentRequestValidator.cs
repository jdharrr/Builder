using BuilderServices.ExpenseCategories.ExpenseCategoryChartService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.ExpenseCategories.Validators;

public class CategoryTotalSpentRequestValidator : AbstractValidator<CategoryTotalSpentRequest>
{
    public CategoryTotalSpentRequestValidator()
    {
        RuleFor(x => x.RangeOption)
            .IsInEnum();
    }
}