namespace BuilderServices.Expenses.ExpenseService.Responses;

public class DashboardCalendarExpenseResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal Cost { get; set; }

    public string? CategoryName { get; set; }

    public string? NextDueDate { get; set; }

    public string RecurrenceRate { get; set; } = "once";

    public int? CategoryId { get; set; }

    public string? Description { get; set; }

    public string StartDate { get; set; } = string.Empty;

    public string? EndDate { get; set; }

    public bool DueLastDayOfMonth { get; set; }

    public bool AutomaticPayments { get; set; }

    public int? AutomaticPaymentCreditCardId { get; set; }

    public bool OneTimeExpenseIsPaid { get; set; }
}

