namespace BuilderServices.CreditCardService.Requests;

public class PayCreditCardBalanceRequest
{
    public required decimal PaymentAmount { get; set; }
    
    public required string PaymentDate { get; set; }

    public decimal CashBackAmount { get; set; } = 0;
}