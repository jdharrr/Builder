using System.Globalization;
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

        RuleForEach(x => x.RewardsRules)
            .ChildRules(rule =>
            {
                rule.RuleFor(x => x)
                    .Must(x => (x.CategoryId.HasValue && !x.AllOtherCategories)
                               || (!x.CategoryId.HasValue && x.AllOtherCategories))
                    .WithMessage("Category or all other categories is required, but not both.");

                rule.RuleFor(x => x.CashBackPercent)
                    .NotEmpty()
                    .GreaterThan(0);
            })
            .When(x => x.RewardsRules.Count > 0);
    }
}
