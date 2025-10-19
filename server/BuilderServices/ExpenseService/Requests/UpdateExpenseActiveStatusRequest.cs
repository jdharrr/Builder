namespace BuilderServices.ExpenseService.Requests;

public class UpdateExpenseActiveStatusRequest
{
    public required int ExpenseId { get; set; }

    public required bool IsActive { get; set; }
}
