using AuthenticationServices;
using BuilderRepositories;
using BuilderRepositories.Requests;
using BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;
using BuilderServices.ExpensePayments.ExpensePaymentTableService.Responses;
using BuilderServices.Responses;

namespace BuilderServices.ExpensePayments.ExpensePaymentTableService;

public class ExpensePaymentTableService(
    ExpensePaymentRepository paymentRepo,
    UserContext userContext
)
{
    public async Task<List<PaymentTablePaymentResponse>> GetAllPaymentsForTableAsync(
        string sort,
        string sortDir,
        string? searchColumn,
        string? searchValue,
        bool showSkipped,
        List<TableFilter> filters
    )
    {
        var payments = await paymentRepo
            .GetAllPaymentsForTableAsync(userContext.UserId, sort, sortDir, searchColumn, searchValue, showSkipped, filters)
            .ConfigureAwait(false);

        return payments.Select(payment => new PaymentTablePaymentResponse
        {
            Id = payment.Id,
            PaymentDate = payment.PaymentDate,
            DueDatePaid = payment.DueDatePaid,
            ExpenseName = payment.ExpenseName,
            Cost = payment.Cost,
            CreditCard = payment.CreditCard ?? string.Empty,
            Skipped = payment.Skipped
        }).ToList();
    }

    public static Dictionary<string, string> GetSearchColumns()
    {
        // Keep expected order for frontend
        return new Dictionary<string, string>()
        {
            { PaymentSearchColumn.PaymentDate.ToString(), PaymentSearchColumn.PaymentDate.GetDisplayName() },
            { PaymentSearchColumn.DueDate.ToString(), PaymentSearchColumn.DueDate.GetDisplayName() },
            { PaymentSearchColumn.ExpenseName.ToString(), PaymentSearchColumn.ExpenseName.GetDisplayName() },
            { PaymentSearchColumn.Amount.ToString(), PaymentSearchColumn.Amount.GetDisplayName() },
            { PaymentSearchColumn.CreditCard.ToString(), PaymentSearchColumn.CreditCard.GetDisplayName() }
        };
    }

    public static Dictionary<string, string> GetSortOptions()
    {
        var sortOptions = new Dictionary<string, string>();
        foreach (var option in Enum.GetValues<PaymentSearchColumn>())
        {
            sortOptions[option.ToString()] = option.GetDisplayName();
        }

        return sortOptions;
    }

    public static TableFilterOptionsResponse GetFilterOptions()
    {
        var filterOptions = new TableFilterOptionsResponse();
        foreach (var option in Enum.GetValues<PaymentTableFilterOption>())
        {
            filterOptions.FilterOptions.Add(new TableFilterOptionResponse
            {
                Filter = option.ToString()!,
                DisplayText = option.GetDisplayText(),
                FilterType = option.GetFilterType().ToString()
            });
        }

        return filterOptions;
    }
}
