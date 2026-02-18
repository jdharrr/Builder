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
    public async Task<CategoryTotalSpentResponse> GetCategoryTotalSpentByRangeAsync(CategoryChartRangeOption rangeOption)
    {
        var response = new CategoryTotalSpentResponse();

        var startOfRange = DateOnly.FromDateTime(DateTime.Today);
        var endOfRange = DateOnly.FromDateTime(DateTime.Today);
        switch (rangeOption)
        {
            case CategoryChartRangeOption.ThisWeek:
                endOfRange = endOfRange.AddDays(7 - (int)endOfRange.DayOfWeek);
                startOfRange = startOfRange.AddDays(-(int)startOfRange.DayOfWeek);
                break;
            case CategoryChartRangeOption.ThisMonth:
                endOfRange = endOfRange.AddDays(DateTime.DaysInMonth(startOfRange.Year, startOfRange.Month) - startOfRange.Day);
                startOfRange = startOfRange.AddDays(-startOfRange.Day + 1);
                break;
            case CategoryChartRangeOption.ThisYear:
                endOfRange = new DateOnly(startOfRange.Year, 12, 31);
                startOfRange = new DateOnly(startOfRange.Year, 1, 1);
                break;
            case CategoryChartRangeOption.LastSixMonths:
                startOfRange = startOfRange.AddMonths(-6);
                break;
            default:
                response.Categories = (await paymentRepo.GetCategoryTotalSpentByRangeAsync(userContext.UserId).ConfigureAwait(false))
                    .Select(category => new CategoryTotalSpentCategoryResponse
                    {
                        Id = category.Id,
                        Name = category.Name,
                        CategoryTotalSpent = category.CategoryTotalSpent
                    }).ToList();
                response.CombinedTotalSpend = await paymentRepo.GetTotalSpentForRangeAsync(userContext.UserId).ConfigureAwait(false);
                return response;
        }

        response.Categories = (await paymentRepo.GetCategoryTotalSpentByRangeAsync(
                userContext.UserId,
                startOfRange.ToString("yyyy-MM-dd"),
                endOfRange.ToString("yyyy-MM-dd"))
            .ConfigureAwait(false))
            .Select(category => new CategoryTotalSpentCategoryResponse
            {
                Id = category.Id,
                Name = category.Name,
                CategoryTotalSpent = category.CategoryTotalSpent
            }).ToList();
        response.CombinedTotalSpend = await paymentRepo.GetTotalSpentForRangeAsync(
                userContext.UserId,
                startOfRange.ToString("yyyy-MM-dd"),
                endOfRange.ToString("yyyy-MM-dd"))
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
}
