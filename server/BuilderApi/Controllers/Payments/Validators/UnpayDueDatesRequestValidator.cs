using BuilderServices.ExpensePayments.ExpensePaymentService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Payments.Validators;

public class UnpayDueDatesRequestValidator : AbstractValidator<UnpayDueDatesRequest>
{
    public UnpayDueDatesRequestValidator()
    {
        RuleFor(x => x.PaymentIds)
            .NotEmpty();

        RuleForEach(x => x.PaymentIds)
            .NotNull();

        RuleFor(x => x.ExpenseId)
            .GreaterThan(0);
    }
}
