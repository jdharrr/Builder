using DatabaseServices.Models;

namespace BuilderServices.ExpensePaymentService.Responses;

public class CategoryTotalSpentResponse
{
    public List<ExpenseCategoryDto> Categories { get; set; } = [];

    public decimal CombinedTotalSpend { get; set; } = 0;
}