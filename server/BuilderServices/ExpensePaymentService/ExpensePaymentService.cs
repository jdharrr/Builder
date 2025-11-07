using AuthenticationServices;
using BuilderRepositories;
using DatabaseServices.Models;

namespace BuilderServices.ExpensePaymentService;

public class ExpensePaymentService
{
    private readonly ExpensePaymentRepository _repo;

    private readonly UserContext _userContext;

    public ExpensePaymentService(ExpensePaymentRepository repo, UserContext userContext)
    {
        _repo = repo;
        _userContext = userContext;
    }

    public async Task<List<ExpensePaymentDto>> GetPaymentsForExpenseAsync(int expenseId)
    {
        return await _repo.GetPaymentsForExpenseAsync(expenseId, _userContext.UserId).ConfigureAwait(false);
    }

    public async Task<double> GetTotalSpentAsync()
    {
        return await _repo.GetTotalSpentForRangeAsync(_userContext.UserId).ConfigureAwait(false);
    }
}
