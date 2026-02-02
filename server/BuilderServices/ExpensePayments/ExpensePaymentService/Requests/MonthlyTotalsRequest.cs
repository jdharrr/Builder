namespace BuilderServices.ExpensePayments.ExpensePaymentService.Requests;

public class MonthlyTotalsRequest
{
    public required int Year { get; set; }
    
    public int? CategoryId { get; set; }
}