namespace BuilderServices.ExpenseService.Requests;

public class UpdateExpenseRequest
{
    public required int ExpenseId { get; set; }
    
    public string? Name { get; set; }
    
    public double? Cost { get; set; }
    
    public string? StartDate { get; set; }
    
    public string? EndDate { get; set; }
    
    public int? CategoryId { get; set; }
    
    public string? Description { get; set; }
    
    public bool? Active { get; set; }
}