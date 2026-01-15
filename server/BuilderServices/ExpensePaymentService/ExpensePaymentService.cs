using AuthenticationServices;
using BuilderRepositories;
using DatabaseServices.Models;

namespace BuilderServices.ExpensePaymentService;

public class ExpensePaymentService
{
    private readonly ExpensePaymentRepository _repo;

    private readonly ExpenseRepository _expenseRepo;

    private readonly UserContext _userContext;

    public ExpensePaymentService(ExpensePaymentRepository repo, ExpenseRepository expenseRepo, UserContext userContext)
    {
        _repo = repo;
        _expenseRepo = expenseRepo;
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

    public async Task PayAllOverdueDatesAsync(int expenseId)
    {
        var expense = await _expenseRepo.GetExpenseByIdAsync(expenseId, _userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Expense not found");

        var currentDueDate = DateOnly.ParseExact(expense.StartDate, "yyyy-MM-dd");
        DateOnly? endDate = expense.EndDate != null ? DateOnly.ParseExact(expense.EndDate, "yyyy-MM-dd") : null;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        while (currentDueDate < today && (endDate == null || currentDueDate <= endDate))
        {
            var paymentExists = await _repo.GetExpensePaymentByDueDateAsync(_userContext.UserId, currentDueDate.ToString("yyyy-MM-dd"), expense.Id) != null;
            if (!paymentExists)
            {
                await _repo.CreateExpensePaymentAsync(expenseId, today.ToString("yyyy-MM-dd"), currentDueDate.ToString("yyyy-MM-dd"), expense.Cost, _userContext.UserId);

                if (endDate != null && currentDueDate >= endDate)
                {
                    await _expenseRepo.UpdateExpenseAsync(new Dictionary<string, object?> { { "active", false }, { "next_due_date", null } }, expenseId, _userContext.UserId);
                    expense.NextDueDate = null;
                    break;
                }
            }

            currentDueDate = expense.RecurrenceRate switch
            {
                "daily" => currentDueDate.AddDays(1),

                "weekly" => currentDueDate.AddDays(7),

                "monthly" => currentDueDate.AddMonths(1),

                "yearly" => currentDueDate.AddYears(1),

                _ => currentDueDate,
            };
        }

        if (expense.NextDueDate != null && DateOnly.ParseExact(expense.NextDueDate, "yyyy-MM-dd") < today)
        {
            await _expenseRepo.UpdateExpenseAsync(new Dictionary<string, object?> { { "next_due_date", currentDueDate.ToString("yyyy-MM-dd") } }, expenseId, _userContext.UserId).ConfigureAwait(false);
        }
    }

    public async Task UnpayDueDateAsync(List<int> paymentIds)
    {
        await _repo.DeleteExpensePaymentsAsync(paymentIds, _userContext.UserId).ConfigureAwait(false);
    }

    public async Task PayDueDateAsync(int expenseId, string dueDatePaid, string? datePaid = null)
    {
        var expense = await _expenseRepo.GetExpenseByIdAsync(expenseId, _userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense. Could not insert payment.");

        if (!BuilderUtils.ExpenseIsForDate(expense, DateOnly.ParseExact(dueDatePaid, "yyyy-MM-dd")))
            throw new GenericException("Due date paid is not valid for this expense.");

        if (string.IsNullOrEmpty(datePaid))
            datePaid = DateTime.UtcNow.ToString("yyyy-MM-dd");

        var lastInsertedId = await _repo.CreateExpensePaymentAsync(expenseId, datePaid, dueDatePaid, expense.Cost, _userContext.UserId).ConfigureAwait(false);
        if (lastInsertedId == 0)
            throw new GenericException("Failed to create payment for expense");

        var dueDatePaidObj = DateOnly.ParseExact(dueDatePaid, "yyyy-MM-dd");
        var nextDueDateObj = DateOnly.ParseExact(expense.NextDueDate!, "yyyy-MM-dd");
        if (dueDatePaidObj >= nextDueDateObj)
        {
            try
            {
                await UpdateNextDueDateAsync(expense, true).ConfigureAwait(false);
            }
            catch
            {
                throw new GenericException("Failed to update next due date for expense");
            }
        }
    }

    private async Task UpdateNextDueDateAsync(ExpenseDto dto, bool isFuture)
    {
        if (dto.RecurrenceRate == "once")
        {
            var updateDict1 = new Dictionary<string, object?>
            {
                { "active", 0 },
                { "next_due_date", null }
            };
            await _expenseRepo.UpdateExpenseAsync(updateDict1, dto.Id, _userContext.UserId).ConfigureAwait(false);
            return;
        }

        var paymentExistsForDueDate = true;
        var currentDueDate = DateOnly.ParseExact(dto.NextDueDate!, "yyyy-MM-dd");
        while (paymentExistsForDueDate)
        {
            if (dto.RecurrenceRate == "monthly" && dto.DueEndOfMonth)
            {
                if (isFuture)
                {
                    currentDueDate = currentDueDate.AddDays(1);
                    currentDueDate = currentDueDate.AddMonths(1).AddDays(-1);
                }
                else
                {
                    currentDueDate = new DateOnly(currentDueDate.Year, currentDueDate.Month, 1);
                    currentDueDate = currentDueDate.AddDays(-1);
                }
            }
            else
            {
                // TODO:if we dont worry about changing due date on unpaying past dates, we can remove isFuture and just always go forward
                currentDueDate = dto.RecurrenceRate switch
                {
                    "daily" => isFuture ? currentDueDate.AddDays(1)
                                          : currentDueDate.AddDays(-1),

                    "weekly" => isFuture ? currentDueDate.AddDays(7)
                                          : currentDueDate.AddDays(-7),

                    "monthly" => isFuture ? currentDueDate.AddMonths(1)
                                          : currentDueDate.AddMonths(-1),

                    "yearly" => isFuture ? currentDueDate.AddYears(1)
                                          : currentDueDate.AddYears(-1),

                    _ => currentDueDate,
                };
            }

            if (dto.EndDate != null && currentDueDate > DateOnly.ParseExact(dto.EndDate, "yyyy-MM-dd"))
            {
                var updateDict2 = new Dictionary<string, object?>
                {
                    { "active", 0 },
                    { "next_due_date", null }
                };
                await _expenseRepo.UpdateExpenseAsync(updateDict2, dto.Id, _userContext.UserId).ConfigureAwait(false);
                return;
            }

            paymentExistsForDueDate = await _repo.GetExpensePaymentByDueDateAsync(_userContext.UserId, currentDueDate.ToString("yyyy-MM-dd"), dto.Id).ConfigureAwait(false) != null;
        }

        var updateDict3 = new Dictionary<string, object?>
        {
            { "next_due_date", currentDueDate.ToString("yyyy-MM-dd") }
        };
        await _expenseRepo.UpdateExpenseAsync(updateDict3, dto.Id, _userContext.UserId).ConfigureAwait(false);
    }
}
