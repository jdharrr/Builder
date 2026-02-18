using BuilderServices.CreditCardService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Payments.Validators;

public class UpdateCreditCardCompanyRequestValidator : AbstractValidator<UpdateCreditCardCompanyRequest>
{
    public UpdateCreditCardCompanyRequestValidator()
    {
        RuleFor(x => x.NewCompanyName)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(100);
    }
}
