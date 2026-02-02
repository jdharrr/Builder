namespace BuilderServices.Expenses.ExpenseTableService.Responses;

public class ExpenseTableExpenseResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal Cost { get; set; }

    public string? Description { get; set; }

    public string RecurrenceRate { get; set; } = "once";

    public string? CreatedAt { get; set; }

    public string? UpdatedAt { get; set; }

    public string? NextDueDate { get; set; }

    public bool Active { get; set; }

    public string StartDate { get; set; } = string.Empty;

    public string? EndDate { get; set; }

    public int? CategoryId { get; set; }

    public string? CategoryName { get; set; }

    public bool DueLastDayOfMonth { get; set; }

    public bool AutomaticPayments { get; set; }

    public int? AutomaticPaymentCreditCardId { get; set; }

    public bool OneTimeExpenseIsPaid { get; set; }

    public Dictionary<string, string> TableActions { get; set; } = [];
}

