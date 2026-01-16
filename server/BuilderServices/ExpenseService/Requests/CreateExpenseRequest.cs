namespace BuilderServices.ExpenseService.Requests;

public class CreateExpenseRequest
{
    public string Name { get; set; } = string.Empty;

    public double Cost { get; set; } = 0.0;

    public string? Description { get; set; } = string.Empty;

    public string RecurrenceRate { get; set; } = string.Empty;
    
    public string StartDate { get; set; } = string.Empty;

    public string? EndDate { get; set; } = string.Empty;

    public bool EndOfTheMonth { get; set; } = false;

    public int? CategoryId { get; set; } = 0;

    public bool PayToNow { get; set; } = false;
}
