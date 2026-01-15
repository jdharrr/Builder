namespace BuilderServices.ExpensePaymentService.Requests;

public class PayDueDateRequest
{
    public required int ExpenseId { get; set; }

    public required string DueDate { get; set; }

    public string? DatePaid { get; set; }
}
