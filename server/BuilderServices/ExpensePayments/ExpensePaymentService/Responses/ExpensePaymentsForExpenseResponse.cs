namespace BuilderServices.ExpensePayments.ExpensePaymentService.Responses;

public class ExpensePaymentsForExpenseResponse
{
    public List<ExpensePaymentsForExpenseItemResponse> Payments { get; set; } = [];
}

public class ExpensePaymentsForExpenseItemResponse
{
    public int Id { get; set; }

    public string PaymentDate { get; set; } = string.Empty;

    public string DueDatePaid { get; set; } = string.Empty;

    public bool Skipped { get; set; }
}

