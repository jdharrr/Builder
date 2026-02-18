using BuilderServices.CreditCardService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Payments.Validators;

public class CreateCreditCardRequestValidator : AbstractValidator<CreateCreditCardRequest>
{
    public CreateCreditCardRequestValidator()
    {
        RuleFor(x => x.CreditCardCompany)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(100);
    }
}
