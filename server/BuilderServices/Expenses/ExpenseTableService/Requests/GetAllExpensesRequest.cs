using BuilderServices.Requests;

namespace BuilderServices.Expenses.ExpenseTableService.Requests;

public class GetAllExpensesRequest
{
    public string Sort { get; set; } = "CreatedAt";

    public string SortDir { get; set; } = "asc";

    public string? SearchColumn { get; set; }

    public string? SearchValue { get; set; }

    public bool ShowInactiveExpenses { get; set; }

    public List<FilterRequest> Filters { get; set; } = [];
}
