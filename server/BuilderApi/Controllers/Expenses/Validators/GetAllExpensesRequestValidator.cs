using BuilderServices.Expenses.ExpenseTableService.Enums;
using BuilderServices.Expenses.ExpenseTableService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Expenses.Validators;

public class GetAllExpensesRequestValidator : AbstractValidator<GetAllExpensesRequest>
{
    public GetAllExpensesRequestValidator()
    {
        RuleFor(x => x.Sort)
            .NotEmpty()
            .IsInEnum();

        RuleFor(x => x.SortDir)
            .NotEmpty()
            .Must(dir => dir is "asc" or "desc");

        RuleFor(x => x.SearchColumn)
            .NotEmpty()
            .IsInEnum()
            .When(x => !string.IsNullOrWhiteSpace(x.SearchValue));

        RuleForEach(x => x.Filters)
            .ChildRules(filter =>
            {
                filter.RuleFor(x => x.Filter)
                    .NotEmpty()
                    .Must(value => Enum.TryParse(typeof(ExpenseTableFilterOption), value, true, out _));
            });
    }
}
