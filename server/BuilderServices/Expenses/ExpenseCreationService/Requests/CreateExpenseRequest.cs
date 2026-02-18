namespace BuilderServices.Expenses.ExpenseService.Requests;

public class CreateExpenseRequest
{
    public string Name { get; set; } = string.Empty;

    public decimal Cost { get; set; } = 0;

    public string? Description { get; set; } = string.Empty;

    public string RecurrenceRate { get; set; } = string.Empty;
    
    public string StartDate { get; set; } = string.Empty;

    public string? EndDate { get; set; } = string.Empty;

    public bool EndOfTheMonth { get; set; } = false;

    public int? CategoryId { get; set; } = 0;

    public OneTimePaymentRequest OneTimePayment { get; set; } = new();

    public PayToNowPaymentRequest PayToNowPayment { get; set; } = new();

    public AutomaticPaymentRequest AutomaticPayment { get; set; } = new();
}

public class OneTimePaymentRequest
{
    public bool IsPaid { get; set; }

    public bool IsCredit { get; set; }

    public string? PaymentDate { get; set; }

    public int? CreditCardId { get; set; }
}

public class PayToNowPaymentRequest
{
    public bool Enabled { get; set; }

    public bool IsCredit { get; set; }

    public int? CreditCardId { get; set; }
}

public class AutomaticPaymentRequest
{
    public bool Enabled { get; set; }

    public int? CreditCardId { get; set; }
}
