namespace BuilderServices.ExpenseCategories.ExpenseCategoryService.Requests;

public class UpdateCategoryNameRequest
{
    public required int CategoryId { get; set; }
    
    public required string NewCategoryName { get; set; }
}