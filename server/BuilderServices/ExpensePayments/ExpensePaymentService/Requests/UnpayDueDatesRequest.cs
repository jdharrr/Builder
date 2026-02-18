namespace BuilderServices.ExpensePayments.ExpensePaymentService.Requests;

public class UnpayDueDatesRequest
{
    public required List<int> PaymentIds { get; set; }
    
    public required int ExpenseId { get; set; }
    
    public bool? RemoveFromCreditCard { get; set; }
}
