using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.ExpensePayments.ExpensePaymentService.Responses;
using DatabaseServices.Models;

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

        var currentDueDate = DateOnly.ParseExact(expense.StartDate, "yyyy-MM-dd");
        DateOnly? endDate = expense.EndDate != null ? DateOnly.ParseExact(expense.EndDate, "yyyy-MM-dd") : null;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        while (currentDueDate < today && (endDate == null || currentDueDate <= endDate))
        {
            var paymentExists = await repo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), expense.Id) != null;
            if (!paymentExists)
            {
                await repo.CreateExpensePaymentAsync(expenseId, today.ToString("yyyy-MM-dd"), currentDueDate.ToString("yyyy-MM-dd"), false, expense.Cost, creditCardId);

                if (creditCardId != null)
                    await creditCardRepo.AddPaymentToCreditCardAsync(expense.Cost, (int)creditCardId, userContext.UserId);
                
                if (endDate != null && currentDueDate >= endDate)
                {
                    await expenseRepo.UpdateExpenseAsync(new Dictionary<string, object?> { { "active", false }, { "next_due_date", null } }, expenseId, userContext.UserId);
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
            await expenseRepo.UpdateExpenseAsync(new Dictionary<string, object?> { { "next_due_date", currentDueDate.ToString("yyyy-MM-dd") } }, expenseId, userContext.UserId).ConfigureAwait(false);
        }
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

        var lastInsertedId = await repo.CreateExpensePaymentAsync(expenseId, datePaid, dueDatePaid, isSkipped, expense.Cost, creditCardId).ConfigureAwait(false);
        if (lastInsertedId == 0)
            throw new GenericException("Failed to create payment for expense");

        if (!isSkipped && creditCardId != null)
            await creditCardRepo.AddPaymentToCreditCardAsync(expense.Cost, (int)creditCardId, userContext.UserId).ConfigureAwait(false);

        var dueDatePaidObj = DateOnly.ParseExact(dueDatePaid, "yyyy-MM-dd");
        var nextDueDateObj = DateOnly.ParseExact(expense.NextDueDate!, "yyyy-MM-dd");
        if (dueDatePaidObj >= nextDueDateObj)
        {
            try
            {
                var nextDueDate = await UpdateNextDueDateAsync(expense).ConfigureAwait(false);
                
                var scheduledPayment = await scheduledPaymentRepo.GetScheduledPaymentAsync(expenseId, dueDatePaid).ConfigureAwait(false);
                if (scheduledPayment != null)
                {
                    await scheduledPaymentRepo.DeleteScheduledPaymentByIdAsync(scheduledPayment.Id).ConfigureAwait(false);

                    if (nextDueDate != null)
                        await scheduledPaymentRepo.SchedulePaymentAsync(expenseId, nextDueDate, creditCardId).ConfigureAwait(false);
                }  
            }
            catch
            {
                throw new GenericException("Failed to update next due date for expense");
            }
        }
    }

    private async Task<string?> UpdateNextDueDateAsync(ExpenseDto dto)
    {
        if (dto.RecurrenceRate == "once")
        {
            var updateDict1 = new Dictionary<string, object?>
            {
                { "active", 0 },
                { "next_due_date", null }
            };
            await expenseRepo.UpdateExpenseAsync(updateDict1, dto.Id, userContext.UserId).ConfigureAwait(false);
            return null;
        }

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
                await expenseRepo.UpdateExpenseAsync(updateDict2, dto.Id, userContext.UserId).ConfigureAwait(false);
                return null;
            }

            paymentExistsForDueDate = await repo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), dto.Id).ConfigureAwait(false) != null;
        }

        var updateDict3 = new Dictionary<string, object?>
        {
            { "next_due_date", currentDueDate.ToString("yyyy-MM-dd") }
        };
        await expenseRepo.UpdateExpenseAsync(updateDict3, dto.Id, userContext.UserId).ConfigureAwait(false);

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
