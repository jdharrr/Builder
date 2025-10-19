namespace BuilderServices.ExpenseService.Requests;

public class CreateExpenseRequest
{
    public string Name { get; set; } = string.Empty;

    public double Cost { get; set; } = 0.0;

    public string? Description { get; set; } = string.Empty;

    public string RecurrenceRate { get; set; } = string.Empty;

    public int UserId { get; set; } = 0;

    public string StartDate { get; set; } = string.Empty;

    public string? EndDate { get; set; } = string.Empty;

    public bool EndOfTheMonth { get; set; } = false;

    public bool IsPaidOnCreation { get; set; } = false;

    public string? InitialDatePaid { get; set; } = string.Empty;

    public int? CategoryId { get; set; } = 0;
}
