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

    public async Task<List<ExpenseCategoryDto>> GetExpenseCategoriesAsync(bool active)
    {
        return await _categoryRepo.GetExpenseCategoriesAsync(_userContext.UserId, active).ConfigureAwait(false);
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

    public async Task SetExpenseCategoryActiveStatusAsync(int categoryId, bool active)
    {
        await _categoryRepo.SetExpenseCategoryActiveStatusAsync(categoryId, active, _userContext.UserId).ConfigureAwait(false);
    }
}
