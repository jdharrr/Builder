using BuilderServices.ExpensePayments.ExpensePaymentChartService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Payments.Validators;

public class MonthlyTotalsRequestValidator : AbstractValidator<MonthlyTotalsRequest>
{
    public MonthlyTotalsRequestValidator()
    {
        RuleFor(x => x.Year)
            .GreaterThan(0);

        RuleFor(x => x.CategoryId)
            .GreaterThan(0)
            .When(x => x.CategoryId != null);
    }
}
