namespace BuilderServices.ExpensePayments.ExpensePaymentService.Requests;

public class UnpayDueDatesRequest
{
    public required List<object> PaymentIds { get; set; }
    
    public required int ExpenseId { get; set; }
}
