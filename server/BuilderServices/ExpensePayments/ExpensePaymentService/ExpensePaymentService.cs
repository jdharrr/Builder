using AuthenticationServices;
using BuilderRepositories;
using BuilderRepositories.Exceptions;
using BuilderServices.ExpensePayments.ExpensePaymentService.Responses;
using DatabaseServices.Models;

namespace BuilderServices.ExpensePayments.ExpensePaymentService;

public class ExpensePaymentService(
    ExpensePaymentRepository repo,
    ExpenseRepository expenseRepo,
    CreditCardRepository creditCardRepo,
    CreditCardRewardRulesRepository rewardRulesRepo,
    ScheduledPaymentRepository scheduledPaymentRepo,
    UserContext userContext
)
{
    #region Public service methods
    
    public async Task<ExpensePaymentsForExpenseResponse> GetPaymentsForExpenseAsync(int expenseId)
    {
        var payments = await repo.GetPaymentsForExpenseAsync(expenseId).ConfigureAwait(false);

        return new ExpensePaymentsForExpenseResponse
        {
            Payments = payments.Select(payment => new ExpensePaymentsForExpenseItemResponse
            {
                Id = payment.Id,
                PaymentDate = payment.PaymentDate,
                DueDatePaid = payment.DueDatePaid,
                Skipped = payment.Skipped,
                CreditCardId = payment.CreditCardId
            }).ToList()
        };
    }

    public async Task<decimal> GetTotalSpentAsync()
    {
        return await repo.GetTotalSpentForRangeAsync(userContext.UserId).ConfigureAwait(false);
    }

    public async Task PayAllOverdueDatesAsync(int expenseId, int? creditCardId = null, bool ignoreCashBack = false, decimal? cashBackOverwrite = null)
    {
        var expense = await expenseRepo.GetExpenseByIdAsync(expenseId, userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Expense not found");

        await repo.BeginTransactionAsync().ConfigureAwait(false);

        DateOnly nextUnpaidDueDate;
        try
        {
            nextUnpaidDueDate = await CreateOverduePaymentsAsync(expense, creditCardId, ignoreCashBack, cashBackOverwrite).ConfigureAwait(false);
        }
        catch (GenericException e)
        {
            await repo.RollbackTransactionAsync().ConfigureAwait(false);
            throw new GenericException(e.Message + " Overdue payments aborted.");
        }
        
        if (expense.NextDueDate is not null && DateOnly.ParseExact(expense.NextDueDate, "yyyy-MM-dd") < nextUnpaidDueDate)
        {
            var updated = await expenseRepo.UpdateExpenseAsync(new Dictionary<string, object?> { { "next_due_date", nextUnpaidDueDate.ToString("yyyy-MM-dd") } }, expenseId, userContext.UserId).ConfigureAwait(false);
            if (!updated)
            {
                await repo.RollbackTransactionAsync().ConfigureAwait(false);
                throw new GenericException("Failed to update expense due date. Overdue payments aborted.");
            }
        }

        await repo.CommitTransactionAsync().ConfigureAwait(false);
    }

    public async Task DeletePaymentsAsync(List<int> paymentIds, int expenseId, bool removeFromCreditCard)
    {
        var expense = await expenseRepo.GetExpenseByIdAsync(expenseId, userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense.");
        
        if (expense.RecurrenceRate == "once")
        {
            var updated = await expenseRepo
                .UpdateExpenseAsync(new Dictionary<string, object?> { { "next_due_date", expense.StartDate }, { "active", 1 } },
                    expenseId, userContext.UserId).ConfigureAwait(false);
            if (!updated)
            {
                await repo.RollbackTransactionAsync().ConfigureAwait(false);
                throw new GenericException("Failed to update expense. Aborting payment deletion");
            }
        }

        await repo.BeginTransactionAsync().ConfigureAwait(false);
        try
        {
            foreach (var paymentId in paymentIds)
                await DeletePaymentAsync(paymentId, removeFromCreditCard).ConfigureAwait(false);
        }
        catch
        {
            await repo.RollbackTransactionAsync().ConfigureAwait(false);
            throw new GenericException("Failed to delete payments");
        }
        await repo.CommitTransactionAsync().ConfigureAwait(false);
    }
    
    public async Task PayDueDateAsync(int expenseId, string dueDatePaid, bool isSkipped, int? creditCardId = null, string? datePaid = null, bool ignoreCashBack = false, decimal? cashBackOverwrite = null)
    {
        var expense = await expenseRepo.GetExpenseByIdAsync(expenseId, userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense. Could not insert payment.");

        if (!BuilderUtils.ExpenseIsForDate(expense, DateOnly.ParseExact(dueDatePaid, "yyyy-MM-dd")))
            throw new GenericException("Due date paid is not valid for this expense.");

        if (string.IsNullOrEmpty(datePaid))
            datePaid = DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd");

        await repo.BeginTransactionAsync().ConfigureAwait(false);
        
        try
        {
            // Use creditCardId param rather than from expense record in case user used a different credit card to pay due date
            await HandlePaymentCreationAsync(expense, datePaid, dueDatePaid, isSkipped, creditCardId, ignoreCashBack, cashBackOverwrite).ConfigureAwait(false);
        }
        catch
        {
            await repo.RollbackTransactionAsync().ConfigureAwait(false);
            throw new GenericException("Failed to create payment.");
        }
        
        try
        {
            await HandlePayDueDateUpdatesAsync(dueDatePaid, creditCardId, expense).ConfigureAwait(false);
        }
        catch
        {
            await repo.RollbackTransactionAsync().ConfigureAwait(false);
            throw new GenericException("Failed to update next due date for expense. Payment aborted.");
        }

        await repo.CommitTransactionAsync().ConfigureAwait(false);
    }
    
    public async Task PayScheduledDueDatesAsync()
    {
        var scheduledPayments = await scheduledPaymentRepo.GetScheduledPaymentsToPayAsync(userContext.UserId);
        foreach (var scheduledPayment in scheduledPayments)
        {
            await PayScheduledDueDateAsync(scheduledPayment).ConfigureAwait(false);
        }
    }

    #endregion
    #region Private helpers
    
    private async Task HandlePayDueDateUpdatesAsync(string dueDatePaid, int? creditCardId, ExpenseDto expense)
    {
        var dueDatePaidObj = DateOnly.ParseExact(dueDatePaid, "yyyy-MM-dd");
        var nextDueDateObj = DateOnly.ParseExact(expense.NextDueDate!, "yyyy-MM-dd");
        if (dueDatePaidObj < nextDueDateObj)
            return;
            
        var nextDueDate = await UpdateNextDueDateAsync(expense).ConfigureAwait(false);
        
        var scheduledPayment = await scheduledPaymentRepo.GetScheduledPaymentAsync(expense.Id, dueDatePaid).ConfigureAwait(false);
        if (scheduledPayment is not null)
        {
            var paymentDeleted = (await scheduledPaymentRepo
                .DeleteScheduledPaymentByIdAsync(scheduledPayment.Id).ConfigureAwait(false)) > 0;
            if (!paymentDeleted)
                throw new GenericException("Failed to update payment schedule. Payment aborted.");

            if (nextDueDate is not null)
            {
                var schedulePaymentId = await scheduledPaymentRepo.SchedulePaymentAsync(expense.Id, nextDueDate)
                    .ConfigureAwait(false);

                if (schedulePaymentId <= 0)
                    throw new Exception("Failed to update payment schedule. Payment aborted.");
            }
        }
    }

    private async Task<string?> UpdateNextDueDateAsync(ExpenseDto dto)
    {
        if (dto.RecurrenceRate != "once") 
            return await UpdateRecurringNextDueDateAsync(dto).ConfigureAwait(false);
        
        var updateDict1 = new Dictionary<string, object?>
        {
            { "active", 0 },
            { "next_due_date", null }
        };
        var updated = await expenseRepo.UpdateExpenseAsync(updateDict1, dto.Id, userContext.UserId).ConfigureAwait(false);
        if (!updated)
            throw new GenericException("Failed to update expense.");
                
        return null;
    }

    private async Task<string?> UpdateRecurringNextDueDateAsync(ExpenseDto dto)
    {
        var currentDueDate = await UpdateExpenseToNextUnpaidDueDate(dto).ConfigureAwait(false);

        if (currentDueDate is null)
            return null;
        
        var updateDict3 = new Dictionary<string, object?>
        {
            { "next_due_date", currentDueDate?.ToString("yyyy-MM-dd") }
        };
        var updated = await expenseRepo.UpdateExpenseAsync(updateDict3, dto.Id, userContext.UserId).ConfigureAwait(false);
        if (!updated)
            throw new GenericException("Failed to update expense");
        
        return currentDueDate?.ToString("yyyy-MM-dd");
    }

    private async Task<DateOnly?> UpdateExpenseToNextUnpaidDueDate(ExpenseDto dto)
    {
        var paymentExistsForDueDate = true;
        var currentDueDate = DateOnly.ParseExact(dto.NextDueDate!, "yyyy-MM-dd");
        while (paymentExistsForDueDate)
        {
            currentDueDate = BuilderUtils.GetNextDueDate(dto.RecurrenceRate, currentDueDate, dto.DueEndOfMonth);

            if (dto.EndDate is not null && currentDueDate > DateOnly.ParseExact(dto.EndDate, "yyyy-MM-dd"))
            {
                var updateDict2 = new Dictionary<string, object?>
                {
                    { "active", 0 },
                    { "next_due_date", null }
                };
                var updated = await expenseRepo.UpdateExpenseAsync(updateDict2, dto.Id, userContext.UserId).ConfigureAwait(false);
                if (!updated)
                    throw new GenericException("Failed to update expense");
                
                return null;
            }

            paymentExistsForDueDate = await repo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), dto.Id).ConfigureAwait(false) is not null;
        }

        return currentDueDate;
    }

    private async Task<DateOnly> CreateOverduePaymentsAsync(ExpenseDto expense, int? creditCardId, bool ignoreCashBack, decimal? cashBackOverwrite)
    {
        var currentDueDate = DateOnly.ParseExact(expense.StartDate, "yyyy-MM-dd");
        DateOnly? endDate = expense.EndDate is not null ? DateOnly.ParseExact(expense.EndDate, "yyyy-MM-dd") : null;
        var today = DateOnly.FromDateTime(DateTime.Today);
        while (currentDueDate < today && (endDate is null || currentDueDate <= endDate))
        {
            var paymentExists = await repo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), expense.Id) is not null;
            if (!paymentExists)
            {
                var expensePaymentId = await repo.CreateExpensePaymentAsync(expense.Id, today.ToString("yyyy-MM-dd"), currentDueDate.ToString("yyyy-MM-dd"), false, expense.Cost, creditCardId);
                if (expensePaymentId <= 0)
                    throw new GenericException("Failed to create a payment.");

                if (creditCardId is not null)
                    await AddPaymentToCreditCardBalanceAsync(expense, (int)creditCardId, (int)expensePaymentId, ignoreCashBack, cashBackOverwrite).ConfigureAwait(false);

                if (currentDueDate >= endDate)
                {
                    var updated = await expenseRepo.UpdateExpenseAsync(new Dictionary<string, object?> { { "active", false }, { "next_due_date", null } }, expense.Id, userContext.UserId);
                    if (!updated)
                        throw new GenericException("Failed to update expense due date. Overdue payments aborted.");
                    
                    expense.NextDueDate = null;
                    break;
                }
            }

            currentDueDate = BuilderUtils.GetNextDueDate(expense.RecurrenceRate, currentDueDate, expense.DueEndOfMonth);
        }

        return currentDueDate;
    }

    private async Task DeletePaymentAsync(int paymentId, bool removeFromCreditCard)
    {
        if (removeFromCreditCard)
        {
            await DeletePaymentFromCreditCardAsync(paymentId).ConfigureAwait(false);
        }

        var deletedPayment = await repo.DeleteExpensePaymentByIdAsync(paymentId).ConfigureAwait(false);
        if (!deletedPayment)
            throw new GenericException("Failed to delete payment/s.");
    }

    private async Task DeletePaymentFromCreditCardAsync(int paymentId)
    {
        var payment = await repo.GetExpensePaymentByIdAsync(paymentId).ConfigureAwait(false);
        if (payment?.CreditCardId is not null)
        {
            var creditBalanceUpdated = await creditCardRepo
                .RemovePaymentFromCreditCard((int)payment.CreditCardId, payment.Cost, userContext.UserId)
                .ConfigureAwait(false);
            if (creditBalanceUpdated <= 0)
                throw new GenericException("Failed to delete payment/s.");

            if (payment.CashBackEarned <= 0)
                return;
                
            var didUpdateCashBack = await creditCardRepo.RemoveFromCashBackBalanceAsync((int)payment.CreditCardId, payment.CashBackEarned).ConfigureAwait(false);
            if (!didUpdateCashBack)
                throw new GenericException("Failed to delete payment/s");
        }
    }
    
    private async Task AddPaymentToCreditCardBalanceAsync(ExpenseDto expense, int creditCardId, int paymentId, bool ignoreCashBack, decimal? cashBackOverwrite = null)
    {
        var creditCardPaymentId = await creditCardRepo.AddPaymentToCreditCardAsync(expense.Cost, creditCardId, userContext.UserId).ConfigureAwait(false);
        if (creditCardPaymentId <= 0)
            throw new GenericException("Failed to add payment to credit card.");

        if (!ignoreCashBack)
            await AddPaymentToCashBackBalanceAsync(creditCardId, paymentId, expense, cashBackOverwrite).ConfigureAwait(false);
    }

    private async Task AddPaymentToCashBackBalanceAsync(int creditCardId, int paymentId, ExpenseDto expense, decimal? cashBackOverwrite)
    {
        var rewardsRule = await rewardRulesRepo.GetRewardRulesByCreditCardIdAsync(creditCardId)
            .ConfigureAwait(false);
        var matchedRule = rewardsRule.FirstOrDefault(x => x.CategoryId == expense.CategoryId)
                          ?? rewardsRule.FirstOrDefault(x => x.AllOtherCategories);
        if (matchedRule is not null)
        {
            var cashBackPercent = (cashBackOverwrite ?? matchedRule.CashBackPercent) / 100;
            var cashBackAmount = expense.Cost * cashBackPercent;
            var didUpdateCashBack = await creditCardRepo.AddToCashBackBalanceAsync(creditCardId, cashBackAmount).ConfigureAwait(false);
            if (!didUpdateCashBack)
                throw new GenericException("Failed to add cash back.");

            var didUpdatePayment = await repo.UpdateCashBackEarnedAsync(paymentId, cashBackAmount).ConfigureAwait(false);
            if (!didUpdatePayment)
                throw new GenericException("Failed to update payments cash back earned");
        }
    }

    private async Task PayScheduledDueDateAsync(ScheduledPaymentDto scheduledPayment)
    {
        var expense = await expenseRepo.GetExpenseByIdAsync(scheduledPayment.ExpenseId, userContext.UserId).ConfigureAwait(false)
                      ?? throw new GenericException("Failed to find expense");

        var currentDueDate = DateOnly.ParseExact(scheduledPayment.ScheduledDueDate, "yyyy-MM-dd");
        var today = DateOnly.FromDateTime(DateTime.Today);
        while (currentDueDate <= today)
        {
            await repo.BeginTransactionAsync().ConfigureAwait(false);

            var paymentExists = await repo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), expense.Id).ConfigureAwait(false) is not null;
            if (!paymentExists)
            {
                try
                {
                    await HandlePaymentCreationAsync(
                        expense,
                        DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd"),
                        currentDueDate.ToString("yyyy-MM-dd"),
                        false,
                        expense.AutomaticPaymentCreditCardId,
                        expense.AutomaticPaymentIgnoreCashBack,
                        expense.AutomaticPaymentCashBackOverwrite,
                        scheduledPayment.Id
                    ).ConfigureAwait(false);
                }
                catch
                {
                    await repo.RollbackTransactionAsync().ConfigureAwait(false);
                    throw new GenericException("Failed to pay one or more scheduled payments.");
                }
            }
            else
            {
                var didDelete = await scheduledPaymentRepo.DeleteScheduledPaymentByDueDateAsync(scheduledPayment.ExpenseId, currentDueDate.ToString("yyyy-MM-dd")).ConfigureAwait(false);
                if (!didDelete)
                {
                    await repo.RollbackTransactionAsync().ConfigureAwait(false);
                    throw new GenericException("Failed to pay one or more scheduled payments.");
                }
            }

            string? nextDueDate;
            try
            {
                nextDueDate = await HandlePaidScheduledPaymentUpdatesAsync(expense).ConfigureAwait(false);
                if (nextDueDate is null)
                {
                    await repo.CommitTransactionAsync().ConfigureAwait(false);
                    break;
                }
            }
            catch
            {
                await repo.RollbackTransactionAsync().ConfigureAwait(false);
                throw new GenericException("Failed to pay one or more scheduled payments.");
            }

            await repo.CommitTransactionAsync().ConfigureAwait(false);

            currentDueDate = DateOnly.ParseExact(nextDueDate, "yyyy-MM-dd");
        }
    }

    private async Task<string?> HandlePaidScheduledPaymentUpdatesAsync(ExpenseDto expense)
    {
        var nextDueDate = await UpdateNextDueDateAsync(expense).ConfigureAwait(false);

        if (nextDueDate is null)
            return null;

        var scheduledPaymentId = await scheduledPaymentRepo
            .SchedulePaymentAsync(expense.Id, nextDueDate)
            .ConfigureAwait(false);
        if (scheduledPaymentId <= 0)
            throw new GenericException("Failed to pay one or more scheduled payments");

        return nextDueDate;
    }

    private async Task HandlePaymentCreationAsync(ExpenseDto expense, string datePaid, string dueDatePaid, bool isSkipped, int? creditCardId, bool ignoreCashBack, decimal? cashBackOverwrite = null, int? scheduledPaymentId = null) 
    {
        var lastInsertedId = await repo.CreateExpensePaymentAsync(expense.Id, datePaid, dueDatePaid, isSkipped, expense.Cost, creditCardId, scheduledPaymentId).ConfigureAwait(false);
        if (lastInsertedId == 0)
            throw new GenericException("Failed to create payment for expense. Payment aborted.");

        if (!isSkipped && creditCardId is not null)
        {
            await AddPaymentToCreditCardBalanceAsync(expense, (int)creditCardId, (int)lastInsertedId, ignoreCashBack, cashBackOverwrite).ConfigureAwait(false);
        }
    }

    #endregion
}
