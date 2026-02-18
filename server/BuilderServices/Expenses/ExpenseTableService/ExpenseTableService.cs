using AuthenticationServices;
using BuilderRepositories;
using BuilderRepositories.Requests;
using BuilderServices.Expenses.ExpenseTableService.Enums;
using BuilderServices.Expenses.ExpenseTableService.Responses;
using BuilderServices.Requests;
using BuilderServices.Responses;

namespace BuilderServices.Expenses.ExpenseTableService;

public class ExpenseTableService(
    ExpenseRepository expenseRepo,
    ExpensePaymentRepository paymentRepo,
    UserContext userContext
)
{
    public async Task<List<ExpenseTableExpenseResponse>> GetAllExpensesForTableAsync(
        string sortColumn,
        string sortDir,
        string? searchColumn,
        string? searchValue,
        bool showInactive,
        List<TableFilter> filters
    )
    {
        var expenses = await expenseRepo
            .GetAllExpensesForTableAsync(userContext.UserId, sortColumn, sortDir, searchColumn, searchValue, showInactive, filters)
            .ConfigureAwait(false);
        var response = new List<ExpenseTableExpenseResponse>();

        foreach (var expense in expenses)
        {
            var recurrenceIsOnce = expense.RecurrenceRate == "once";
            var tableActions = new Dictionary<string, string>();
            if (!recurrenceIsOnce)
            {
                if (expense.Active)
                {
                    tableActions[ExpenseTableAction.Inactive.ToString()] = ExpenseTableAction.Inactive.GetActionText(recurrenceIsOnce);
                    tableActions[ExpenseTableAction.Pay.ToString()] = ExpenseTableAction.Pay.GetActionText(recurrenceIsOnce);
                }
                else
                {
                    tableActions[ExpenseTableAction.Active.ToString()] = ExpenseTableAction.Active.GetActionText(recurrenceIsOnce);
                }

                tableActions[ExpenseTableAction.Unpay.ToString()] = ExpenseTableAction.Unpay.GetActionText(recurrenceIsOnce);
            }
            else
            {
                var paymentExists = (await paymentRepo.GetPaymentsForExpenseAsync(expense.Id).ConfigureAwait(false)).Count > 0;
                if (paymentExists)
                {
                    tableActions[ExpenseTableAction.Unpay.ToString()] = ExpenseTableAction.Unpay.GetActionText(recurrenceIsOnce);
                    expense.OneTimeExpenseIsPaid = true;
                }
                else
                {
                    tableActions[ExpenseTableAction.Pay.ToString()] = ExpenseTableAction.Pay.GetActionText(recurrenceIsOnce);
                }
            }

            tableActions[ExpenseTableAction.Edit.ToString()] = ExpenseTableAction.Edit.GetActionText(recurrenceIsOnce);
            tableActions[ExpenseTableAction.Delete.ToString()] = ExpenseTableAction.Delete.GetActionText(recurrenceIsOnce);

            response.Add(new ExpenseTableExpenseResponse
            {
                Id = expense.Id,
                Name = expense.Name,
                Cost = expense.Cost,
                Description = expense.Description,
                RecurrenceRate = expense.RecurrenceRate,
                CreatedAt = expense.CreatedAt,
                UpdatedAt = expense.UpdatedAt,
                NextDueDate = expense.NextDueDate,
                Active = expense.Active,
                StartDate = expense.StartDate,
                EndDate = expense.EndDate,
                CategoryId = expense.CategoryId,
                CategoryName = expense.CategoryName,
                DueLastDayOfMonth = expense.DueEndOfMonth,
                AutomaticPayments = expense.AutomaticPayments,
                AutomaticPaymentCreditCardId = expense.AutomaticPaymentCreditCardId,
                OneTimeExpenseIsPaid = expense.OneTimeExpenseIsPaid,
                TableActions = tableActions
            });
        }

        return response;
    }

    public static Dictionary<string, string> GetSortOptions()
    {
        var sortOptions = new Dictionary<string, string>();
        foreach (var option in Enum.GetValues<ExpenseSortOption>())
        {
            sortOptions[option.ToString()] = option.GetDisplayName();
        }

        return sortOptions;
    }

    public static Dictionary<string, string> GetSearchColumns()
    {
        // Keep expected order for frontend
        return new Dictionary<string, string>()
        {
            { ExpenseSearchColumn.CreatedDate.ToString(), ExpenseSearchColumn.CreatedDate.GetDisplayName() },
            { ExpenseSearchColumn.UpdatedDate.ToString(), ExpenseSearchColumn.UpdatedDate.GetDisplayName() },
            { ExpenseSearchColumn.Category.ToString(), ExpenseSearchColumn.Category.GetDisplayName() },
            { ExpenseSearchColumn.Name.ToString(), ExpenseSearchColumn.Name.GetDisplayName() },
            { ExpenseSearchColumn.Cost.ToString(), ExpenseSearchColumn.Cost.GetDisplayName() },
            { ExpenseSearchColumn.NextDueDate.ToString(), ExpenseSearchColumn.NextDueDate.GetDisplayName() },
            { ExpenseSearchColumn.RecurrenceRate.ToString(), ExpenseSearchColumn.RecurrenceRate.GetDisplayName() },
            { ExpenseSearchColumn.StartDate.ToString(), ExpenseSearchColumn.StartDate.GetDisplayName() },
            { ExpenseSearchColumn.EndDate.ToString(), ExpenseSearchColumn.EndDate.GetDisplayName() },
        };
    }

    public static Dictionary<string, string> GetExpenseTableBatchActions()
    {
        return new Dictionary<string, string>()
        {
            { ExpenseTableBatchAction.UpdateCategory.ToString(), ExpenseTableBatchAction.UpdateCategory.GetDisplayName() }
        };
    }

    public static TableFilterOptionsResponse GetExpenseTableFilterOptions()
    {
        var filterOptions = new TableFilterOptionsResponse();
        foreach (var option in Enum.GetValues<ExpenseTableFilterOption>())
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

    public static List<TableFilter> BuildTableFilters(List<FilterRequest> filterRequests)
    {
        List<TableFilter> filters = [];
        if (filterRequests.Count <= 0)
            return filters;
        
        foreach (var filter in filterRequests)
        {
            var filterEnum = Enum.Parse<ExpenseTableFilterOption>(filter.Filter);
            filters.Add(new TableFilter
            {
                FilterType = filterEnum.GetFilterType(),
                FilterColumn = filterEnum.GetFilterColumn(),
                Value1 = filter.Value1,
                Value2 = filter.Value2
            });
        }

        return filters;
    }
}
