namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Responses;

public class PaymentTablePaymentResponse
{
    public int Id { get; set; }

    public int ExpenseId { get; set; }

    public string PaymentDate { get; set; } = string.Empty;

    public string DueDatePaid { get; set; } = string.Empty;

    public string ExpenseName { get; set; } = string.Empty;

    public decimal Cost { get; set; }

    public string CreditCard { get; set; } = string.Empty;

    public bool Skipped { get; set; }
    
    public string Category { get; set; } = string.Empty;

    public string RecurrenceRate { get; set; } = string.Empty;

    public Dictionary<string, string> TableActions { get; set; } = new();
}
