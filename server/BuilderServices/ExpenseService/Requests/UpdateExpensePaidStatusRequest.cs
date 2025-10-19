namespace BuilderServices.ExpenseService.Requests;

public class UpdateExpensePaidStatusRequest
{
    public required int ExpenseId { get; set; }

    public required string DueDate { get; set; }

    public required bool IsPaid { get; set; }

    public required string DatePaid { get; set; }
}
