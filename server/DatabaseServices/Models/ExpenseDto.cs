namespace DatabaseServices.Models;

public class ExpenseDto
{
    public int Id { get; set; } = 0;

    public string Name { get; set; } = string.Empty;

    public decimal Cost { get; set; } = 0;

    public string? Description { get; set; } = string.Empty;

    public string RecurrenceRate { get; set; } = "once";

    public decimal? LastCost { get; set; } = null;

    public string? CostUpdatedAt { get; set; } = null;

    public string? CreatedAt { get; set; } = null;

    public string? UpdatedAt { get; set; } = null;

    public string? NextDueDate { get; set; } = null;

    public bool Active { get; set; } = true;

    public string StartDate { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd");

    public string? EndDate { get; set; } = null;

    public int? CategoryId { get; set; } = null;

    public bool DueEndOfMonth { get; set; } = false;

    public bool IsLate { get; set; } = false;

    public string? CategoryName { get; set; } = string.Empty;

    public string? DueDatePaid { get; set; }

    public bool AutomaticPayments { get; set; } = false;
    
    public int? AutomaticPaymentCreditCardId { get; set; }

    public Dictionary<string, string>? TableActions { get; set; }
}
