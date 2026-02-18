using BuilderServices;
using BuilderServices.Expenses.ExpenseService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Expenses.Validators;

public class UpdateExpenseRequestValidator : AbstractValidator<UpdateExpenseRequest>
{
    public UpdateExpenseRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(100)
            .When(x => x.Name is not null);

        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0)
            .When(x => x.Cost is not null);

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .When(x => x.Description is not null);

        RuleFor(x => x.EndDate)
            .Must(ValidatorService.IsIsoDate)
            .When(x => !string.IsNullOrWhiteSpace(x.EndDate))
            .WithMessage("End date must be in yyyy-MM-dd format.");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0)
            .When(x => x.CategoryId is not null);

        RuleFor(x => x.AutomaticPaymentsCreditCardId)
            .GreaterThan(0)
            .When(x => x.AutomaticPaymentsCreditCardId is not null);
    }

}
