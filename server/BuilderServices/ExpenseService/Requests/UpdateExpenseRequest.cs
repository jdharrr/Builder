namespace BuilderServices.ExpenseService.Requests;

public class UpdateExpenseRequest
{
    public string? Name { get; set; }
    
    public decimal? Cost { get; set; }
    
    public string? EndDate { get; set; }
    
    public int? CategoryId { get; set; }
    
    public string? Description { get; set; }
    
    public bool? Active { get; set; }

    public bool? AutomaticPayments { get; set; } = false;
    
    public int? AutomaticPaymentsCreditCardId { get; set; }
}