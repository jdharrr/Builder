namespace BuilderServices.ExpensePaymentService.Requests;

public class UnpayDueDatesRequest
{
    public required List<object> PaymentIds { get; set; }
}
