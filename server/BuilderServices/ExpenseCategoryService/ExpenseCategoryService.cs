using AuthenticationServices;
using BuilderRepositories;
using DatabaseServices.Models;

namespace BuilderServices.ExpenseCategoryService;

public class ExpenseCategoryService
{
    private readonly ExpenseCategoryRepository _repo;

    private readonly UserContext _userContext;

    public ExpenseCategoryService(ExpenseCategoryRepository repo, UserContext userContext)
    {
        _repo = repo;
        _userContext = userContext;
    }

    public async Task CreateExpenseCategoryAsync(string categoryName)
    {
        var rowsAffected = await _repo.CreateExpenseCategoryAsync(categoryName, _userContext.UserId).ConfigureAwait(false);
        if (rowsAffected == 0)
        {
            throw new GenericException("Failed to create expense category.");
        }
    }

    public async Task<List<ExpenseCategoryDto>> GetExpenseCategoriesAsync()
    {
        return await _repo.GetExpenseCategoriesAsync(_userContext.UserId).ConfigureAwait(false);
    }
}
