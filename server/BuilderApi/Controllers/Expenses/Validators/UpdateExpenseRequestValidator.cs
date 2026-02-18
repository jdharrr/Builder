using BuilderServices.Expenses.ExpenseService.Requests;
using FluentValidation;
using System.Text.RegularExpressions;

namespace BuilderApi.Controllers.Expenses.Validators;

public class UpdateExpenseRequestValidator : AbstractValidator<UpdateExpenseRequest>
{
    public UpdateExpenseRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(100)
            .When(x => x.Name != null);

        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0)
            .When(x => x.Cost != null);

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .When(x => x.Description != null);

        RuleFor(x => x.EndDate)
            .Must(IsIsoDate)
            .When(x => !string.IsNullOrWhiteSpace(x.EndDate))
            .WithMessage("End date must be in yyyy-MM-dd format.");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0)
            .When(x => x.CategoryId != null);

        RuleFor(x => x.AutomaticPaymentsCreditCardId)
            .GreaterThan(0)
            .When(x => x.AutomaticPaymentsCreditCardId != null);
    }

    private static bool IsIsoDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        return Regex.IsMatch(value, @"^\d{4}-\d{2}-\d{2}$");
    }
}
