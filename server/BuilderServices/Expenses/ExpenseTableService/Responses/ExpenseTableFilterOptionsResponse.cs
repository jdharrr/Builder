using BuilderServices.Responses;

namespace BuilderServices.Expenses.ExpenseTableService.Responses;

public class ExpenseTableFilterOptionsResponse
{
    public TableFilterOptionsResponse FilterOptions { get; set; } = new();
}

