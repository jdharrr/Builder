using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.ExpensePayments.ExpensePaymentService.Responses;
using DatabaseServices.Models;
using Microsoft.AspNetCore.Antiforgery;

namespace BuilderServices.ExpensePayments.ExpensePaymentService;

public class ExpensePaymentService(
    ExpensePaymentRepository repo,
    ExpenseRepository expenseRepo,
    CreditCardRepository creditCardRepo,
    ScheduledPaymentRepository scheduledPaymentRepo,
    UserContext userContext
)
{
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
                Skipped = payment.Skipped
            }).ToList()
        };
    }

    public async Task<decimal> GetTotalSpentAsync()
    {
        return await repo.GetTotalSpentForRangeAsync(userContext.UserId).ConfigureAwait(false);
    }

    public async Task PayAllOverdueDatesAsync(int expenseId, int? creditCardId = null)
    {
        var expense = await expenseRepo.GetExpenseByIdAsync(expenseId, userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Expense not found");

        await repo.BeginTransactionAsync().ConfigureAwait(false);
        
        var currentDueDate = DateOnly.ParseExact(expense.StartDate, "yyyy-MM-dd");
        DateOnly? endDate = expense.EndDate != null ? DateOnly.ParseExact(expense.EndDate, "yyyy-MM-dd") : null;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        while (currentDueDate < today && (endDate == null || currentDueDate <= endDate))
        {
            var paymentExists = await repo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), expense.Id) != null;
            if (!paymentExists)
            {
                var expensePaymentId = await repo.CreateExpensePaymentAsync(expenseId, today.ToString("yyyy-MM-dd"), currentDueDate.ToString("yyyy-MM-dd"), false, expense.Cost, creditCardId);
                if (expensePaymentId <= 0)
                {
                    await repo.RollbackTransactionAsync().ConfigureAwait(false);
                    throw new GenericException("Failed to create a payment. Overdue payments aborted.");
                }

                if (creditCardId != null)
                {
                    var creditCardPaymentId = await creditCardRepo.AddPaymentToCreditCardAsync(expense.Cost, (int)creditCardId,
                        userContext.UserId);
                    if (creditCardPaymentId <= 0)
                    {
                        await repo.RollbackTransactionAsync().ConfigureAwait(false);
                        throw new GenericException("Failed to create credit card payment. Overdue payments aborted.");
                    }
                }

                if (endDate != null && currentDueDate >= endDate)
                {
                    var updated = await expenseRepo.UpdateExpenseAsync(new Dictionary<string, object?> { { "active", false }, { "next_due_date", null } }, expenseId, userContext.UserId);
                    if (!updated)
                    {
                        await repo.RollbackTransactionAsync().ConfigureAwait(false);
                        throw new GenericException("Failed to update expense due date. Overdue payments aborted.");
                    }
                    
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
            var updated = await expenseRepo.UpdateExpenseAsync(new Dictionary<string, object?> { { "next_due_date", currentDueDate.ToString("yyyy-MM-dd") } }, expenseId, userContext.UserId).ConfigureAwait(false);
            if (!updated)
            {
                await repo.RollbackTransactionAsync().ConfigureAwait(false);
                throw new GenericException("Failed to update expense due date. Overdue payments aborted.");
            }
        }

        await repo.CommitTransactionAsync().ConfigureAwait(false);
    }

    public async Task UnpayDueDateAsync(List<object> paymentIds, int expenseId)
    {
        var expense = await expenseRepo.GetExpenseByIdAsync(expenseId, userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense.");
        
        if (expense.RecurrenceRate == "once")
        {
            await expenseRepo
                .UpdateExpenseAsync(new Dictionary<string, object?> { { "next_due_date", expense.StartDate }, { "active", 1 } },
                    expenseId, userContext.UserId).ConfigureAwait(false);
        }
        
        await repo.DeleteExpensePaymentsAsync(paymentIds).ConfigureAwait(false);
    }
    
    public async Task PayDueDateAsync(int expenseId, string dueDatePaid, bool isSkipped, int? creditCardId = null, string? datePaid = null)
    {
        var expense = await expenseRepo.GetExpenseByIdAsync(expenseId, userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense. Could not insert payment.");

        if (!BuilderUtils.ExpenseIsForDate(expense, DateOnly.ParseExact(dueDatePaid, "yyyy-MM-dd")))
            throw new GenericException("Due date paid is not valid for this expense.");

        if (string.IsNullOrEmpty(datePaid))
            datePaid = DateTime.UtcNow.ToString("yyyy-MM-dd");

        // Pay Due Date Transaction
        await repo.BeginTransactionAsync().ConfigureAwait(false);
        
        // Use creditCardId param rather than from expense record in case user used a different credit card to pay due date
        var lastInsertedId = await repo.CreateExpensePaymentAsync(expenseId, datePaid, dueDatePaid, isSkipped, expense.Cost, creditCardId).ConfigureAwait(false);
        if (lastInsertedId == 0)
        {
            await repo.RollbackTransactionAsync().ConfigureAwait(false);
            throw new GenericException("Failed to create payment for expense. Payment aborted.");
        }

        if (!isSkipped && creditCardId != null)
        {
            var creditCardPaymentId = await creditCardRepo
                .AddPaymentToCreditCardAsync(expense.Cost, (int)creditCardId, userContext.UserId)
                .ConfigureAwait(false);

            if (creditCardPaymentId <= 0)
            {
                await repo.RollbackTransactionAsync().ConfigureAwait(false);
                throw new GenericException("Failed to add payment to credit card. Payment aborted.");
            }
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

    private async Task HandlePayDueDateUpdatesAsync(string dueDatePaid, int? creditCardId, ExpenseDto expense)
    {
        var dueDatePaidObj = DateOnly.ParseExact(dueDatePaid, "yyyy-MM-dd");
        var nextDueDateObj = DateOnly.ParseExact(expense.NextDueDate!, "yyyy-MM-dd");
        if (dueDatePaidObj < nextDueDateObj)
            return;
            
        var nextDueDate = await UpdateNextDueDateAsync(expense).ConfigureAwait(false);
        
        var scheduledPayment = await scheduledPaymentRepo.GetScheduledPaymentAsync(expense.Id, dueDatePaid).ConfigureAwait(false);
        if (scheduledPayment != null)
        {
            var paymentDeleted = (await scheduledPaymentRepo
                .DeleteScheduledPaymentByIdAsync(scheduledPayment.Id).ConfigureAwait(false)) > 0;
            if (!paymentDeleted)
                throw new GenericException("Failed to update payment schedule. Payment aborted.");

            if (nextDueDate != null)
            {
                var schedulePaymentId = await scheduledPaymentRepo.SchedulePaymentAsync(expense.Id, nextDueDate, creditCardId)
                    .ConfigureAwait(false);

                if (schedulePaymentId <= 0)
                    throw new Exception("Failed to update payment schedule. Payment aborted.");
            }
        }
    }

    private async Task<string?> UpdateNextDueDateAsync(ExpenseDto dto)
    {
        // Transactions should be handled in the calling function
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
        bool updated;
        var paymentExistsForDueDate = true;
        var currentDueDate = DateOnly.ParseExact(dto.NextDueDate!, "yyyy-MM-dd");
        while (paymentExistsForDueDate)
        {
            if (dto is { RecurrenceRate: "monthly", DueEndOfMonth: true })
            {
                currentDueDate = currentDueDate.AddDays(1);
                currentDueDate = currentDueDate.AddMonths(1).AddDays(-1);
            }
            else
            {
                currentDueDate = dto.RecurrenceRate switch
                {
                    "daily" => currentDueDate.AddDays(1),
                    "weekly" => currentDueDate.AddDays(7),
                    "monthly" => currentDueDate.AddMonths(1),
                    "yearly" => currentDueDate.AddYears(1),
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
                updated = await expenseRepo.UpdateExpenseAsync(updateDict2, dto.Id, userContext.UserId).ConfigureAwait(false);
                if (!updated)
                    throw new GenericException("Failed to update expense");
                
                return null;
            }

            paymentExistsForDueDate = await repo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), dto.Id).ConfigureAwait(false) != null;
        }

        var updateDict3 = new Dictionary<string, object?>
        {
            { "next_due_date", currentDueDate.ToString("yyyy-MM-dd") }
        };
        updated = await expenseRepo.UpdateExpenseAsync(updateDict3, dto.Id, userContext.UserId).ConfigureAwait(false);
        if (!updated)
            throw new GenericException("Failed to update expense");
        
        return currentDueDate.ToString("yyyy-MM-dd");
    }
    
    public async Task PayScheduledDueDatesAsync()
    {
        var scheduledPayments = await scheduledPaymentRepo.GetScheduledPaymentsToPayAsync(userContext.UserId);
        foreach (var scheduledPayment in scheduledPayments)
        {
            var expense = await expenseRepo.GetExpenseByIdAsync(scheduledPayment.ExpenseId, userContext.UserId).ConfigureAwait(false)
                ?? throw new GenericException("Failed to find expense");
            
            var currentDueDate = DateOnly.ParseExact(scheduledPayment.ScheduledDueDate, "yyyy-MM-dd");
            var today = DateOnly.FromDateTime(DateTime.Today);
            while (currentDueDate <= today)
            {
                await repo.CreateExpensePaymentAsync(
                    scheduledPayment.ExpenseId,
                    DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd"),
                    currentDueDate.ToString("yyyy-MM-dd"),
                    false,
                    expense.Cost,
                    scheduledPayment.CreditCardId,
                    scheduledPayment.Id
                );

                if (scheduledPayment.CreditCardId != null)
                    await creditCardRepo.AddPaymentToCreditCardAsync(expense.Cost, (int)scheduledPayment.CreditCardId, userContext.UserId).ConfigureAwait(false);

                var nextDueDate = await UpdateNextDueDateAsync(expense).ConfigureAwait(false);
                if (nextDueDate != null)
                    await scheduledPaymentRepo
                        .SchedulePaymentAsync(scheduledPayment.ExpenseId, nextDueDate, scheduledPayment.CreditCardId)
                        .ConfigureAwait(false);
                else
                    break;
                
                currentDueDate = DateOnly.ParseExact(nextDueDate, "yyyy-MM-dd");
            }
        }
    }
    
}