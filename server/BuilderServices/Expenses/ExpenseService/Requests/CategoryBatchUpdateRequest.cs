namespace BuilderServices.Expenses.ExpenseService.Requests;

public class CategoryBatchUpdateRequest
{
    public required List<object> ExpenseIds { get; set; }

    public required int CategoryId { get; set; }
}