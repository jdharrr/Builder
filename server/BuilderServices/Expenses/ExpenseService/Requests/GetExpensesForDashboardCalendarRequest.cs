namespace BuilderServices.Expenses.ExpenseService.Requests;

public class GetExpensesForDashboardCalendarRequest
{
    public required int Year { get; set; }

    public required int Month { get; set; }
}
