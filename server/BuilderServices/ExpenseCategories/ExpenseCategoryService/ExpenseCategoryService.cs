using AuthenticationServices;
using BuilderRepositories;
using BuilderRepositories.Exceptions;
using BuilderServices.ExpenseCategories.ExpenseCategoryChartService.Enums;
using BuilderServices.ExpenseCategories.ExpenseCategoryService.Responses;
using DatabaseServices.Models;

namespace BuilderServices.ExpenseCategories.ExpenseCategoryService;

public class ExpenseCategoryService(
    ExpenseCategoryRepository categoryRepo,
    ExpenseRepository expenseRepo,
    UserContext userContext)
{
    #region Public service methods
    
    public async Task<bool> CreateExpenseCategoryAsync(string categoryName)
    {
        var rowsAffected = await categoryRepo.CreateExpenseCategoryAsync(categoryName, userContext.UserId).ConfigureAwait(false);
        if (rowsAffected == 0)
        {
            throw new GenericException("Failed to create expense category.");
        }

        return true;
    }

    public async Task<List<ExpenseCategoryResponse>> GetExpenseCategoriesAsync(bool active)
    {
        var categories = await categoryRepo.GetExpenseCategoriesAsync(userContext.UserId, active).ConfigureAwait(false);

        return categories.Select(category => new ExpenseCategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Active = category.Active
        }).ToList();
    }
    
    public async Task<ExpenseCategoryDropdownResponse> GetExpenseCategoriesForDropdownAsync(bool active)
    {
        return new ExpenseCategoryDropdownResponse
        {
            Options = (await categoryRepo.GetExpenseCategoriesAsync(userContext.UserId, active).ConfigureAwait(false))
                .Select(x => x.Name).ToList()
        };
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

    public async Task CategoryBatchUpdateAsync(List<int> expenseIds, int categoryId)
    {
        await expenseRepo.CategoryBatchUpdateAsync(expenseIds, categoryId, userContext.UserId).ConfigureAwait(false);
    }

    public async Task UpdateCategoryNameAsync(int categoryId, string newCategoryName)
    {
        await expenseRepo.UpdateCategoryNameAsync(categoryId, newCategoryName, userContext.UserId).ConfigureAwait(false);
    }

    public async Task DeleteExpenseCategoryAsync(int categoryId)
    {
        await categoryRepo.DeleteExpenseCategoryAsync(categoryId, userContext.UserId).ConfigureAwait(false);
    }

    public async Task SetExpenseCategoryActiveStatusAsync(int categoryId, bool active)
    {
        await categoryRepo.SetExpenseCategoryActiveStatusAsync(categoryId, active, userContext.UserId).ConfigureAwait(false);
    }
    
    #endregion
}
