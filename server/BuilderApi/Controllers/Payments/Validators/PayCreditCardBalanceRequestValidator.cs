using BuilderServices;
using BuilderServices.CreditCardService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Payments.Validators;

public class PayCreditCardBalanceRequestValidator : AbstractValidator<PayCreditCardBalanceRequest>
{
    public PayCreditCardBalanceRequestValidator()
    {
        RuleFor(x => x.PaymentAmount)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Payment amount must not be negative");

        RuleFor(x => x.CashBackAmount)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Cash back amount must not be negative");

        RuleFor(x => x)
            .Must(x => x.PaymentAmount > 0 || x.CashBackAmount > 0)
            .WithMessage("Payment amount or cash back must be greater than zero");

        RuleFor(x => x.PaymentDate)
            .NotEmpty()
            .Must(ValidatorService.IsIsoDate)
            .WithMessage("Payment date must be in yyyy-MM-dd format.");
    }
}
