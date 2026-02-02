namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Responses;

public class PaymentTablePaymentResponse
{
    public int Id { get; set; }

    public string PaymentDate { get; set; } = string.Empty;

    public string DueDatePaid { get; set; } = string.Empty;

    public string ExpenseName { get; set; } = string.Empty;

    public decimal Cost { get; set; }

    public string CreditCard { get; set; } = string.Empty;

    public bool Skipped { get; set; }
}
