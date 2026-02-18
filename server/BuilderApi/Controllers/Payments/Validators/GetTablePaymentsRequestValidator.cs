using BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;
using BuilderServices.ExpensePayments.ExpensePaymentTableService.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Payments.Validators;

public class GetTablePaymentsRequestValidator : AbstractValidator<GetTablePaymentsRequest>
{
    public GetTablePaymentsRequestValidator()
    {
        RuleFor(x => x.Sort)
            .IsInEnum();

        RuleFor(x => x.SortDir)
            .NotEmpty()
            .Must(dir => dir is "asc" or "desc");

        RuleFor(x => x.SearchColumn)
            .IsInEnum()
            .When(x => !string.IsNullOrWhiteSpace(x.SearchValue));

        RuleForEach(x => x.Filters)
            .ChildRules(filter =>
            {
                filter.RuleFor(x => x.Filter)
                    .NotEmpty()
                    .Must(value => Enum.TryParse(typeof(PaymentTableFilterOption), value, true, out _));
            });
    }
}
