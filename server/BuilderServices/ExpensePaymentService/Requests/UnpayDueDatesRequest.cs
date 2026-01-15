namespace BuilderServices.ExpensePaymentService.Requests;

public class UnpayDueDatesRequest
{
    public required List<int> PaymentIds { get; set; }
}
