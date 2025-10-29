namespace BuilderServices.ExpenseService.Requests;

public class CategoryBatchUpdateRequest
{
    public required List<object> ExpenseIds { get; set; }

    public required int CategoryId { get; set; }
}