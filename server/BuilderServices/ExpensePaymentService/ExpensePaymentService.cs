using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.ExpensePaymentService.Responses;
using BuilderServices.ExpenseService.Enums;
using DatabaseServices.Models;

namespace BuilderServices.ExpensePaymentService;

public class ExpensePaymentService
{
    private readonly ExpensePaymentRepository _paymentRepo;

    private readonly ExpenseRepository _expenseRepo;

    private readonly CreditCardRepository _creditCardRepo;

    private readonly ScheduledPaymentRepository _scheduledPaymentRepo;

    private readonly UserContext _userContext;
    
    public ExpensePaymentService(ExpensePaymentRepository repo, ExpenseRepository expenseRepo, CreditCardRepository creditCardRepo, ScheduledPaymentRepository scheduledPaymentRepo, UserContext userContext)
    {
        _paymentRepo = repo;
        _expenseRepo = expenseRepo;
        _creditCardRepo = creditCardRepo;
        _scheduledPaymentRepo = scheduledPaymentRepo;
        _userContext = userContext;
    }

    public async Task<List<ExpensePaymentDto>> GetPaymentsForExpenseAsync(int expenseId)
    {
        return await _paymentRepo.GetPaymentsForExpenseAsync(expenseId).ConfigureAwait(false);
    }

    public async Task<decimal> GetTotalSpentAsync()
    {
        return await _paymentRepo.GetTotalSpentForRangeAsync(_userContext.UserId).ConfigureAwait(false);
    }

    public async Task PayAllOverdueDatesAsync(int expenseId, int? creditCardId = null)
    {
        var expense = await _expenseRepo.GetExpenseByIdAsync(expenseId, _userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Expense not found");

        var currentDueDate = DateOnly.ParseExact(expense.StartDate, "yyyy-MM-dd");
        DateOnly? endDate = expense.EndDate != null ? DateOnly.ParseExact(expense.EndDate, "yyyy-MM-dd") : null;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        while (currentDueDate < today && (endDate == null || currentDueDate <= endDate))
        {
            var paymentExists = await _paymentRepo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), expense.Id) != null;
            if (!paymentExists)
            {
                await _paymentRepo.CreateExpensePaymentAsync(expenseId, today.ToString("yyyy-MM-dd"), currentDueDate.ToString("yyyy-MM-dd"), false, expense.Cost, creditCardId);

                if (creditCardId != null)
                    await _creditCardRepo.AddPaymentToCreditCardAsync(expense.Cost, (int)creditCardId, _userContext.UserId);
                
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

    public async Task UnpayDueDateAsync(List<object> paymentIds)
    {
        await _paymentRepo.DeleteExpensePaymentsAsync(paymentIds).ConfigureAwait(false);
    }
    
    public async Task PayDueDateAsync(int expenseId, string dueDatePaid, bool isSkipped, int? creditCardId = null, string? datePaid = null)
    {
        var expense = await _expenseRepo.GetExpenseByIdAsync(expenseId, _userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense. Could not insert payment.");

        if (!BuilderUtils.ExpenseIsForDate(expense, DateOnly.ParseExact(dueDatePaid, "yyyy-MM-dd")))
            throw new GenericException("Due date paid is not valid for this expense.");

        if (string.IsNullOrEmpty(datePaid))
            datePaid = DateTime.UtcNow.ToString("yyyy-MM-dd");

        var lastInsertedId = await _paymentRepo.CreateExpensePaymentAsync(expenseId, datePaid, dueDatePaid, isSkipped, expense.Cost, creditCardId).ConfigureAwait(false);
        if (lastInsertedId == 0)
            throw new GenericException("Failed to create payment for expense");

        if (!isSkipped && creditCardId != null)
            await _creditCardRepo.AddPaymentToCreditCardAsync(expense.Cost, (int)creditCardId, _userContext.UserId).ConfigureAwait(false);

        var dueDatePaidObj = DateOnly.ParseExact(dueDatePaid, "yyyy-MM-dd");
        var nextDueDateObj = DateOnly.ParseExact(expense.NextDueDate!, "yyyy-MM-dd");
        if (dueDatePaidObj >= nextDueDateObj)
        {
            try
            {
                var nextDueDate = await UpdateNextDueDateAsync(expense, true).ConfigureAwait(false);
                
                var scheduledPayment = await _scheduledPaymentRepo.GetScheduledPaymentAsync(expenseId, dueDatePaid).ConfigureAwait(false);
                if (scheduledPayment != null)
                {
                    await _scheduledPaymentRepo.DeleteScheduledPaymentByIdAsync(scheduledPayment.Id).ConfigureAwait(false);

                    if (nextDueDate != null)
                        await _scheduledPaymentRepo.SchedulePaymentAsync(expenseId, nextDueDate, creditCardId).ConfigureAwait(false);
                }  
            }
            catch
            {
                throw new GenericException("Failed to update next due date for expense");
            }
        }
    }

    private async Task<string?> UpdateNextDueDateAsync(ExpenseDto dto, bool isFuture)
    {
        if (dto.RecurrenceRate == "once")
        {
            var updateDict1 = new Dictionary<string, object?>
            {
                { "active", 0 },
                { "next_due_date", null }
            };
            await _expenseRepo.UpdateExpenseAsync(updateDict1, dto.Id, _userContext.UserId).ConfigureAwait(false);
            return null;
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
                return null;
            }

            paymentExistsForDueDate = await _paymentRepo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), dto.Id).ConfigureAwait(false) != null;
        }

        var updateDict3 = new Dictionary<string, object?>
        {
            { "next_due_date", currentDueDate.ToString("yyyy-MM-dd") }
        };
        await _expenseRepo.UpdateExpenseAsync(updateDict3, dto.Id, _userContext.UserId).ConfigureAwait(false);

        return currentDueDate.ToString("yyyy-MM-dd");
    }
    
    public async Task PayScheduledDueDatesAsync()
    {
        var scheduledPayments = await _scheduledPaymentRepo.GetScheduledPaymentsToPayAsync(_userContext.UserId);
        foreach (var scheduledPayment in scheduledPayments)
        {
            var expense = await _expenseRepo.GetExpenseByIdAsync(scheduledPayment.ExpenseId, _userContext.UserId).ConfigureAwait(false)
                ?? throw new GenericException("Failed to find expense");
            
            var currentDueDate = DateOnly.ParseExact(scheduledPayment.ScheduledDueDate, "yyyy-MM-dd");
            var today = DateOnly.FromDateTime(DateTime.Today);
            while (currentDueDate <= today)
            {
                await _paymentRepo.CreateExpensePaymentAsync(
                    scheduledPayment.ExpenseId,
                    DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd"),
                    currentDueDate.ToString("yyyy-MM-dd"),
                    false,
                    expense.Cost,
                    scheduledPayment.CreditCardId,
                    scheduledPayment.Id
                );

                if (scheduledPayment.CreditCardId != null)
                    await _creditCardRepo.AddPaymentToCreditCardAsync(expense.Cost, (int)scheduledPayment.CreditCardId, _userContext.UserId).ConfigureAwait(false);

                var nextDueDate = await UpdateNextDueDateAsync(expense, true).ConfigureAwait(false);
                if (nextDueDate != null)
                    await _scheduledPaymentRepo
                        .SchedulePaymentAsync(scheduledPayment.ExpenseId, nextDueDate, scheduledPayment.CreditCardId)
                        .ConfigureAwait(false);
                else
                    break;
                
                currentDueDate = DateOnly.ParseExact(nextDueDate, "yyyy-MM-dd");
            }
        }
    }
    
    public async Task<CategoryTotalSpentResponse> GetCategoryTotalSpentByRangeAsync(string rangeOption)
    {
        var response = new CategoryTotalSpentResponse();
        
        if (!Enum.TryParse(typeof(CategoryChartRangeOption), rangeOption, out var option))
            throw new GenericException("Invalid range request for category chart");

        var startOfRange = DateOnly.FromDateTime(DateTime.Today);
        var endOfRange = DateOnly.FromDateTime(DateTime.Today);
        switch (option)
        {
            case CategoryChartRangeOption.ThisWeek:
                startOfRange = startOfRange.AddDays(-(int)startOfRange.DayOfWeek);
                endOfRange = endOfRange.AddDays(7 - (int)endOfRange.DayOfWeek);
                break;
            case CategoryChartRangeOption.ThisMonth:
                startOfRange = startOfRange.AddDays(-startOfRange.Day + 1);
                endOfRange = endOfRange.AddDays(DateTime.DaysInMonth(startOfRange.Year, startOfRange.Month) - startOfRange.Day);
                break;
            case CategoryChartRangeOption.ThisYear:
                startOfRange = new DateOnly(startOfRange.Year, 1, 1);
                endOfRange = new DateOnly(startOfRange.Year, 12, 31);
                break;
            case CategoryChartRangeOption.LastSixMonths:
                startOfRange = startOfRange.AddMonths(-6);
                break;
            default:
                response.Categories = await _paymentRepo.GetCategoryTotalSpentByRangeAsync(_userContext.UserId).ConfigureAwait(false);
                response.CombinedTotalSpend = await _paymentRepo.GetTotalSpentForRangeAsync(_userContext.UserId).ConfigureAwait(false);
                return response;
        }

        response.Categories = await _paymentRepo.GetCategoryTotalSpentByRangeAsync(_userContext.UserId, startOfRange.ToString("yyyy-MM-dd"), endOfRange.ToString("yyyy-MM-dd")).ConfigureAwait(false);
        response.CombinedTotalSpend = await _paymentRepo.GetTotalSpentForRangeAsync(_userContext.UserId, startOfRange.ToString("yyyy-MM-dd"), endOfRange.ToString("yyyy-MM-dd")).ConfigureAwait(false);

        return response;
    }
}
