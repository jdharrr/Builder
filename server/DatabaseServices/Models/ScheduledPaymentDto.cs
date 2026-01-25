namespace DatabaseServices.Models;

public class ScheduledPaymentDto
{
    public int Id { get; set; }
    
    public int ExpenseId { get; set; }
    
    public int? CreditCardId { get; set; }
    
    public required string ScheduledDueDate { get; set; }
}