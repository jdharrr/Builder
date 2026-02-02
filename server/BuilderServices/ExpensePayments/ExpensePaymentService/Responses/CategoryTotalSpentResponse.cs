namespace BuilderServices.ExpensePayments.ExpensePaymentService.Responses;

public class CategoryTotalSpentResponse
{
    public List<CategoryTotalSpentCategoryResponse> Categories { get; set; } = [];

    public decimal CombinedTotalSpend { get; set; } = 0;
}

public class CategoryTotalSpentCategoryResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal CategoryTotalSpent { get; set; }
}
