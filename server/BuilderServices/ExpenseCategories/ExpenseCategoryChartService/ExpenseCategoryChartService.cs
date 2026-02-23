using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.ExpenseCategories.ExpenseCategoryChartService.Enums;
using BuilderServices.ExpenseCategories.ExpenseCategoryChartService.Responses;

namespace BuilderServices.ExpenseCategories.ExpenseCategoryChartService;

public class ExpenseCategoryChartService(
    ExpensePaymentRepository paymentRepo,
    UserContext userContext
)
{
    #region Public service methods
    
    public async Task<CategoryTotalSpentResponse> GetCategoryTotalSpentByRangeAsync(CategoryChartRangeOption rangeOption)
    {
        var response = new CategoryTotalSpentResponse();

        DateOnly? startOfRange = DateOnly.FromDateTime(DateTime.Today);
        DateOnly? endOfRange = DateOnly.FromDateTime(DateTime.Today);
        UpdateCategoryTotalSpentRange(rangeOption, ref startOfRange, ref endOfRange);

        var categoryTotals = await paymentRepo.GetCategoryTotalSpentByRangeAsync(
                    userContext.UserId,
                    startOfRange?.ToString("yyyy-MM-dd"),
                    endOfRange?.ToString("yyyy-MM-dd"))
                .ConfigureAwait(false);
        response.Categories = categoryTotals.Select(category => new CategoryTotalSpentCategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            CategoryTotalSpent = category.CategoryTotalSpent
        }).ToList();
        
        response.CombinedTotalSpend = await paymentRepo.GetTotalSpentForRangeAsync(
                    userContext.UserId,
                    startOfRange?.ToString("yyyy-MM-dd"),
                    endOfRange?.ToString("yyyy-MM-dd"))
                .ConfigureAwait(false);
        
        return response;
    }

    public async Task<CategoryAvgSpentResponse> GetAvgSpentForCategoriesAsync(int year)
    {
        var categoryResult = await paymentRepo.GetAvgSpentForCategoriesAsync(userContext.UserId, year);

        var response = new CategoryAvgSpentResponse();
        foreach (var kvp in categoryResult)
        {
            response.Categories[kvp.Key] = kvp.Value;
        }

        return response;
    }
    
    #endregion
    #region Private Helpers

    private static void UpdateCategoryTotalSpentRange(CategoryChartRangeOption rangeOption, ref DateOnly? startOfRange, ref DateOnly? endOfRange)
    {
        switch (rangeOption)
        {
            case CategoryChartRangeOption.ThisWeek:
                endOfRange = endOfRange?.AddDays(7 - (int)endOfRange?.DayOfWeek!);
                startOfRange = startOfRange?.AddDays(-(int)startOfRange?.DayOfWeek!);
                break;
            case CategoryChartRangeOption.ThisMonth:
                if (startOfRange is null)
                    break;
                endOfRange = endOfRange?.AddDays(DateTime.DaysInMonth((int)startOfRange?.Year!, (int)startOfRange?.Month!) - (int)startOfRange?.Day!);
                startOfRange = startOfRange?.AddDays(-(int)startOfRange?.Day! + 1);
                break;
            case CategoryChartRangeOption.ThisYear:
                if (startOfRange is null)
                    break;
                endOfRange = new DateOnly((int)startOfRange?.Year!, 12, 31);
                startOfRange = new DateOnly((int)startOfRange?.Year!, 1, 1);
                break;
            case CategoryChartRangeOption.LastSixMonths:
                startOfRange = startOfRange?.AddMonths(-6);
                break;
            case CategoryChartRangeOption.AllTime:
                startOfRange = null;
                endOfRange = null;
                break;
        }
    }
    
    #endregion
}
