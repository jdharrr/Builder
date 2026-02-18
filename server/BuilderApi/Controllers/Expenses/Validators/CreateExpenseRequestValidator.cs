using BuilderServices;
using BuilderServices.Expenses.ExpenseService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Expenses.Validators;

public partial class CreateExpenseRequestValidator : AbstractValidator<CreateExpenseRequest>
{
    public CreateExpenseRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(100);

        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.Description)
            .MaximumLength(500);

        RuleFor(x => x.RecurrenceRate)
            .NotEmpty()
            .Must(rate => rate is "once" or "daily" or "weekly" or "monthly" or "yearly")
            .WithMessage("Invalid recurrence rate.");

        RuleFor(x => x.StartDate)
            .NotEmpty()
            .Must(ValidatorService.IsIsoDate)
            .WithMessage("Start date must be in yyyy-MM-dd format.");

        RuleFor(x => x.EndDate)
            .Must(ValidatorService.IsIsoDate)
            .When(x => !string.IsNullOrWhiteSpace(x.EndDate))
            .WithMessage("End date must be in yyyy-MM-dd format.");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0)
            .When(x => x.CategoryId is not null);

        RuleFor(x => x.OneTimePayment.PaymentDate)
            .Must(ValidatorService.IsIsoDate)
            .When(x => !string.IsNullOrWhiteSpace(x.OneTimePayment.PaymentDate))
            .WithMessage("Payment date must be in yyyy-MM-dd format.");

        RuleFor(x => x.OneTimePayment.CreditCardId)
            .GreaterThan(0)
            .When(x => x.OneTimePayment.CreditCardId is not null);

        RuleFor(x => x.PayToNowPayment.CreditCardId)
            .GreaterThan(0)
            .When(x => x.PayToNowPayment.CreditCardId is not null);

        RuleFor(x => x.AutomaticPayment.CreditCardId)
            .GreaterThan(0)
            .When(x => x.AutomaticPayment.CreditCardId is not null);
        
        #region Policy Rules
        RuleFor(x => x.OneTimePayment)
            .Must(payment => !(payment.IsPaid && payment.IsCredit))
            .WithMessage("Cannot provide both credit and payment.");

        RuleFor(x => x)
            .Must(request =>
            {
                if (request.OneTimePayment is { IsCredit: true, CreditCardId: null })
                    return false;
                if (request.PayToNowPayment is { Enabled: true, IsCredit: true, CreditCardId: null })
                    return false;
                if (request.AutomaticPayment is { Enabled: true, CreditCardId: null })
                    return false;
                return true;
            })
            .WithMessage("Must provide a credit card for payment.");

        RuleFor(x => x.OneTimePayment.PaymentDate)
            .NotEmpty()
            .When(x => x.OneTimePayment.IsPaid || x.OneTimePayment.IsCredit)
            .WithMessage("Must provide a payment date for expense.");

        RuleFor(x => x)
            .Must(request => request.RecurrenceRate == "once" || !(request.OneTimePayment.IsPaid || request.OneTimePayment.IsCredit))
            .WithMessage("Payment requires a recurrence rate of once.");

        RuleFor(x => x)
            .Must(request => request.RecurrenceRate != "once" || !request.PayToNowPayment.Enabled)
            .WithMessage("Pay to now cannot have recurrence rate of once.");
        #endregion
    }

}
