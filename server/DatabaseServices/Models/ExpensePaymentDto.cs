namespace DatabaseServices.Models;

public class ExpensePaymentDto
{
    public int Id { get; set; } = 0;

    public int ExpenseId { get; set; } = 0;
    
    public decimal Cost { get; set; } = 0;

    public string PaymentDate { get; set; } = string.Empty;

    public string DueDatePaid { get; set; } = string.Empty;

    public bool Skipped { get; set; } = false;
    
    public string? CreditCard { get; set; }
    
    public string ExpenseName { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string RecurrenceRate { get; set; } = string.Empty;
}
