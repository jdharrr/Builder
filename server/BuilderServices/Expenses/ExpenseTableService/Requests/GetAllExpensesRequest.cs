using BuilderServices.Expenses.ExpenseTableService.Enums;
using BuilderServices.Requests;

namespace BuilderServices.Expenses.ExpenseTableService.Requests;

public class GetAllExpensesRequest
{
    public ExpenseSortOption Sort { get; set; } = ExpenseSortOption.CreatedDate;

    public string SortDir { get; set; } = "asc";

    public ExpenseSearchColumn? SearchColumn { get; set; }

    public string? SearchValue { get; set; }

    public bool ShowInactiveExpenses { get; set; }

    public List<FilterRequest> Filters { get; set; } = [];
}
