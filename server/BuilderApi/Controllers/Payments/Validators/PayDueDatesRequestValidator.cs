using BuilderServices.ExpensePayments.ExpensePaymentService.Requests;
using FluentValidation;
using System.Text.RegularExpressions;

namespace BuilderApi.Controllers.Payments.Validators;

public class PayDueDatesRequestValidator : AbstractValidator<PayDueDatesRequest>
{
    public PayDueDatesRequestValidator()
    {
        RuleFor(x => x.ExpenseId)
            .GreaterThan(0);

        RuleFor(x => x.DueDates)
            .NotEmpty();

        RuleForEach(x => x.DueDates)
            .Must(IsIsoDate)
            .WithMessage("Due date must be in yyyy-MM-dd format.");

        RuleFor(x => x.DatePaid)
            .Must(IsIsoDate)
            .When(x => !string.IsNullOrWhiteSpace(x.DatePaid))
            .WithMessage("Payment date must be in yyyy-MM-dd format.");

        RuleFor(x => x.CreditCardId)
            .GreaterThan(0)
            .When(x => x.CreditCardId != null);
    }

    private static bool IsIsoDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        return Regex.IsMatch(value, @"^\d{4}-\d{2}-\d{2}$");
    }
}
