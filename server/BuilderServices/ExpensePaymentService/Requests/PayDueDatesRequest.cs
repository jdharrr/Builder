namespace BuilderServices.ExpensePaymentService.Requests;

public class PayDueDatesRequest
{
    public required int ExpenseId { get; set; }

    public required List<string> DueDates { get; set; }

    public string? DatePaid { get; set; }

    public bool IsSkipped { get; set; } = false;
    
    public int? CreditCardId { get; set; }
}
