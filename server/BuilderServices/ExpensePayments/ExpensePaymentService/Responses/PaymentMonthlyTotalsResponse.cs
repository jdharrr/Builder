namespace BuilderServices.ExpensePayments.ExpensePaymentService.Responses;

public class PaymentMonthlyTotalsResponse
{
    public List<PaymentMonthlyTotalItemResponse> MonthlyTotals { get; set; } = [];

    public decimal YearTotalSpent { get; set; }
}

public class PaymentMonthlyTotalItemResponse
{
    public required string Month { get; set; }

    public required decimal TotalSpent { get; set; } = 0;
}
