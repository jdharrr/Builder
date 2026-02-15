namespace BuilderServices.ExpensePayments.ExpensePaymentChartService.Requests;

public class MonthlyTotalsRequest
{
    public required int Year { get; set; }
    
    public int? CategoryId { get; set; }
}
