namespace BuilderServices.Expenses.ExpenseService.Responses;

public class DashboardUpcomingExpenseResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal Cost { get; set; }

    public string RecurrenceRate { get; set; } = "once";

    public string StartDate { get; set; } = string.Empty;

    public string? EndDate { get; set; }

    public string? NextDueDate { get; set; }

    public bool AutomaticPayments { get; set; }

    public bool DueEndOfMonth { get; set; }
}

