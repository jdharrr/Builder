using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.ExpenseService.Enums;
using DatabaseServices.Models;

namespace BuilderServices.ExpenseCategoryService;

public class ExpenseCategoryService
{
    private readonly ExpenseCategoryRepository _categoryRepo;

    private readonly ExpenseRepository _expenseRepo;

    private readonly UserContext _userContext;

    public ExpenseCategoryService(ExpenseCategoryRepository categoryRepo, ExpenseRepository expenseRepo, UserContext userContext)
    {
        _categoryRepo = categoryRepo;
        _expenseRepo = expenseRepo;
        _userContext = userContext;
    }

    public async Task CreateExpenseCategoryAsync(string categoryName)
    {
        var rowsAffected = await _categoryRepo.CreateExpenseCategoryAsync(categoryName, _userContext.UserId).ConfigureAwait(false);
        if (rowsAffected == 0)
        {
            throw new GenericException("Failed to create expense category.");
        }
    }

    public async Task<List<ExpenseCategoryDto>> GetExpenseCategoriesAsync()
    {
        return await _categoryRepo.GetExpenseCategoriesAsync(_userContext.UserId).ConfigureAwait(false);
    }

    public async Task<List<ExpenseCategoryDto>> GetExpenseCategoriesWithTotalSpentAsync(string rangeOption)
    {
        if (!Enum.TryParse(typeof(CategoryChartRangeOption), rangeOption, out var option))
            throw new GenericException("Invalid range request for category chart");

        DateOnly startOfRange = DateOnly.FromDateTime(DateTime.Today);
        DateOnly endOfRange = DateOnly.FromDateTime(DateTime.Today);
        switch (option)
        {
            case CategoryChartRangeOption.ThisWeek:
                startOfRange.AddDays(-(int)startOfRange.DayOfWeek);
                endOfRange.AddDays(7 - (int)endOfRange.DayOfWeek);
                break;
            case CategoryChartRangeOption.ThisMonth:
                startOfRange.AddDays(-(DateTime.DaysInMonth(startOfRange.Year, startOfRange.Month) - startOfRange.Day));
                endOfRange.AddDays(DateTime.DaysInMonth(startOfRange.Year, startOfRange.Month) - startOfRange.Day);
                break;
            case CategoryChartRangeOption.ThisYear:
                startOfRange = new DateOnly(startOfRange.Year, 1, 1);
                endOfRange = new DateOnly(startOfRange.Year, 12, 31);
                break;
            case CategoryChartRangeOption.LastSixMonths:
                startOfRange = startOfRange.AddMonths(-6);
                break;
            default:
                return await _categoryRepo.GetExpenseCategoriesWithTotalSpentAsync(_userContext.UserId).ConfigureAwait(false);
        }

        return await _categoryRepo.GetExpenseCategoriesWithTotalSpentAsync(_userContext.UserId, startOfRange, endOfRange).ConfigureAwait(false);
    }

    public static Dictionary<string, string> GetCategoryChartRangeOptions()
    {
        return new Dictionary<string, string>()
        {
            { CategoryChartRangeOption.AllTime.ToString(), CategoryChartRangeOption.AllTime.GetDisplayName() },
            { CategoryChartRangeOption.ThisWeek.ToString(), CategoryChartRangeOption.ThisWeek.GetDisplayName() },
            { CategoryChartRangeOption.ThisMonth.ToString(), CategoryChartRangeOption.ThisMonth.GetDisplayName() },
            { CategoryChartRangeOption.ThisYear.ToString(), CategoryChartRangeOption.ThisYear.GetDisplayName() },
            { CategoryChartRangeOption.LastSixMonths.ToString(), CategoryChartRangeOption.LastSixMonths.GetDisplayName() },
        };
    }

    public async Task CategoryBatchUpdateAsync(List<object> expenseIds, int categoryId)
    {
        await _expenseRepo.CategoryBatchUpdateAsync(expenseIds, categoryId, _userContext.UserId).ConfigureAwait(false);
    }

    public async Task UpdateCategoryNameAsync(int categoryId, string newCategoryName)
    {
        await _expenseRepo.UpdateCategoryNameAsync(categoryId, newCategoryName, _userContext.UserId).ConfigureAwait(false);
    }

    public async Task DeleteExpenseCategoryAsync(int categoryId)
    {
        await _categoryRepo.DeleteExpenseCategoryAsync(categoryId, _userContext.UserId).ConfigureAwait(false);
    }
}
