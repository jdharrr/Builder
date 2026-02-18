using BuilderServices;
using BuilderServices.ExpensePayments.ExpensePaymentService.Requests;
using FluentValidation;

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
            .Must(ValidatorService.IsIsoDate)
            .WithMessage("Due date must be in yyyy-MM-dd format.");

        RuleFor(x => x.DatePaid)
            .Must(ValidatorService.IsIsoDate)
            .When(x => !string.IsNullOrWhiteSpace(x.DatePaid))
            .WithMessage("Payment date must be in yyyy-MM-dd format.");

        RuleFor(x => x.CreditCardId)
            .GreaterThan(0)
            .When(x => x.CreditCardId is not null);
    }

}
