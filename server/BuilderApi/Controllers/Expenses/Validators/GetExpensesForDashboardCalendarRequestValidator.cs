using BuilderServices.Expenses.ExpenseService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Expenses.Validators;

public class GetExpensesForDashboardCalendarRequestValidator : AbstractValidator<GetExpensesForDashboardCalendarRequest>
{
    public GetExpensesForDashboardCalendarRequestValidator()
    {
        RuleFor(x => x.Year)
            .GreaterThanOrEqualTo(1000)
            .LessThanOrEqualTo(9999)
            .WithMessage("Invalid year.");

        RuleFor(x => x.Month)
            .InclusiveBetween(1, 12)
            .WithMessage("Invalid month.");
    }
}
