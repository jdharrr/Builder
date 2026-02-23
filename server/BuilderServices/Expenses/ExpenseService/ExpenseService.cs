using AuthenticationServices;
using BuilderRepositories;
using BuilderRepositories.Enums;
using BuilderRepositories.Exceptions;
using BuilderServices.Expenses.ExpenseService.Requests;
using BuilderServices.Expenses.ExpenseService.Responses;
using DatabaseServices.Models;

namespace BuilderServices.Expenses.ExpenseService;

public class ExpenseService(
    ExpenseRepository expenseRepo,
    ExpensePaymentRepository paymentRepo,
    UserContext userContext,
    ScheduledPaymentRepository scheduledPaymentRepo
)
{
    private readonly int _upcomingDaysLimit = 7;

    #region Public service methods
    
    public async Task<long> CreateExpenseAsync(CreateExpenseRequest request)
    {
        var automaticPayment = request.AutomaticPayment;

        var expenseDto = new ExpenseDto
        {
            Name = request.Name,
            Cost = request.Cost,
            Description = request.Description,
            RecurrenceRate = request.RecurrenceRate.GetRepoValue(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            DueEndOfMonth = request.EndOfTheMonth,
            CategoryId = request.CategoryId,
            AutomaticPayments = automaticPayment.Enabled,
            AutomaticPaymentCreditCardId = automaticPayment.CreditCardId,
            AutomaticPaymentCashBackOverwrite = automaticPayment.CashBackOverwrite,
            AutomaticPaymentIgnoreCashBack = automaticPayment.IgnoreCashBack
        };

        if (request.EndOfTheMonth)
        {
            var year = int.Parse(expenseDto.StartDate[..4]);
            var month = int.Parse(expenseDto.StartDate.Substring(4, 2));
            expenseDto.StartDate = $"{year}-{month}-{DateTime.DaysInMonth(year, month)}";
        }

        var currentDueDate = DateOnly.ParseExact(expenseDto.StartDate, "yyyy-MM-dd");
        var today = DateOnly.FromDateTime(DateTime.Today);
        while (expenseDto.RecurrenceRate != "once" && currentDueDate < today)
        {
            currentDueDate = BuilderUtils.GetNextDueDate(expenseDto.RecurrenceRate, currentDueDate, expenseDto.DueEndOfMonth);
        }

        expenseDto.NextDueDate = currentDueDate.ToString("yyyy-MM-dd");
        
        var lastInsertedId = await expenseRepo.CreateExpenseAsync(expenseDto, userContext.UserId).ConfigureAwait(false);
        if (lastInsertedId == 0)
            throw new GenericException("Failed to create expense");

        if (!automaticPayment.Enabled) 
            return lastInsertedId;
        
        var scheduledPaymentId = await scheduledPaymentRepo
            .SchedulePaymentAsync((int)lastInsertedId, expenseDto.NextDueDate)
            .ConfigureAwait(false);

        if (scheduledPaymentId <= 0)
            throw new GenericException("Failed to schedule next payment");

        return lastInsertedId;
    }

    public async Task<Dictionary<string, List<DashboardCalendarExpenseResponse>>> GetExpensesForDashboardCalendarAsync(int year, int month)
    {
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var firstDate = new DateOnly(year, month, 1);
        var lastDate = new DateOnly(year, month, daysInMonth);
        var expenses = await expenseRepo.GetExpensesForDateRangeAsync(userContext.UserId, firstDate, lastDate).ConfigureAwait(false);
        
        return MapExpensesForCalendarResponse(year, month, expenses);
    }

    public async Task<Dictionary<string, List<DashboardUpcomingExpenseResponse>>> GetUpcomingExpensesAsync()
    {
        var startDate = DateOnly.FromDateTime(DateTime.Today);
        var endDate = startDate.AddDays(_upcomingDaysLimit);

        var expenses = await expenseRepo.GetExpensesForDateRangeAsync(
            userContext.UserId, 
            startDate, 
            endDate
        ).ConfigureAwait(false);

        return await MapExpensesForUpcomingExpensesResponseAsync(startDate, endDate, expenses).ConfigureAwait(false);
    }

    public async Task UpdateExpenseAsync(int expenseId, string? name = null, decimal? cost = null,
        string? endDate = null, int? categoryId = null, string? description = null, 
        int? active = null, int? automaticPayments = null, int? automaticPaymentsCreditCardId = null,
        bool? automaticPaymentsIgnoreCashBack = null, decimal? automaticPaymentsCashBackOverwrite = null)
    {
        var expense = await expenseRepo.GetExpenseByIdAsync(expenseId, userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense");
        
        string? nextDueDate = null;
        if (active == 1 && expense.RecurrenceRate != "once")
        {
            if (expense.EndDate is not null && DateOnly.ParseExact(expense.EndDate, "yyyy-MM-dd") < DateOnly.FromDateTime(DateTime.UtcNow))
                throw new GenericException("Cannot activate expense with end date in the past");
            
            nextDueDate = BuilderUtils.GetNextFutureDueDate(expense.RecurrenceRate, expense.NextDueDate ?? expense.StartDate, expense.DueEndOfMonth);
        }

        var newActiveStatus = active;
        if (endDate is not null && expense.NextDueDate is not null)
        {
            var endDateObj = DateOnly.ParseExact(endDate, "yyyy-MM-dd");
            var currNextDueDate = DateOnly.ParseExact(expense.NextDueDate, "yyyy-MM-dd");
            if (endDateObj < currNextDueDate)
            {
                newActiveStatus = 0;
                nextDueDate = null;
            }
        }
        
        await HandleScheduledPaymentsUpdatesAsync(expense, automaticPayments, active, automaticPaymentsCreditCardId).ConfigureAwait(false);

        var values = new
        {
            name = name ?? expense.Name,
            cost = cost ?? expense.Cost,
            end_date = endDate ?? expense.EndDate,
            category_id = categoryId ?? expense.CategoryId,
            description = description ?? expense.Description,
            active = newActiveStatus ?? (expense.Active ? 1 : 0),
            automatic_payments = automaticPayments ?? (expense.AutomaticPayments ? 1 : 0),
            automatic_payment_credit_card_id = automaticPaymentsCreditCardId ?? expense.AutomaticPaymentCreditCardId,
            automatic_payment_ignore_cash_back = automaticPaymentsIgnoreCashBack ?? expense.AutomaticPaymentIgnoreCashBack,
            automatic_payment_cash_back_overwrite = automaticPaymentsCashBackOverwrite ?? expense.AutomaticPaymentCashBackOverwrite,
            next_due_date = nextDueDate ?? expense.NextDueDate
        };
        
        var updateDict = new Dictionary<string, object?>();
        foreach (var prop in values.GetType().GetProperties())
        {
            var value = prop.GetValue(values);
            updateDict[prop.Name] = value;
        }

        await expenseRepo.UpdateExpenseAsync(updateDict, expenseId, userContext.UserId);
    }

    public async Task DeleteExpenseAsync(int expenseId)
    {
        var paymentExists = (await paymentRepo.GetPaymentsForExpenseAsync(expenseId).ConfigureAwait(false)).Count > 0;
        if (paymentExists)
            throw new BadRequestException("Please delete payments on the expense before deleting.");
            
        await expenseRepo.DeleteExpenseAsync(expenseId, userContext.UserId).ConfigureAwait(false);
    }

    public async Task<List<DashboardLateExpenseResponse>> GetLateExpensesAsync()
    {
        var expenses = await expenseRepo.GetAllExpensesAsync(userContext.UserId);

        var lateExpenses = new List<DashboardLateExpenseResponse>();
        foreach (var expense in expenses)
        {
            if (await CheckExpenseHasLateDueDateAsync(expense).ConfigureAwait(false))
            {
                lateExpenses.Add(new DashboardLateExpenseResponse
                {
                    Id = expense.Id,
                    Name = expense.Name
                });
            }
        }

        return lateExpenses;
    }

    public async Task<List<string>> GetLateDatesForExpense(int expenseId)
    {
        List<string> lateDates = [];

        var expense = await expenseRepo.GetExpenseByIdAsync(expenseId, userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense.");

        DateOnly? endDate = expense.EndDate is not null ? DateOnly.ParseExact(expense.EndDate, "yyyy-MM-dd") : null;
        var currentDate = DateOnly.ParseExact(expense.StartDate, "yyyy-MM-dd");
        var today = DateOnly.FromDateTime(DateTime.Today);
        while(currentDate < today && (endDate is null || currentDate <= endDate))
        {
            var paymentExists = (await paymentRepo.GetExpensePaymentByDueDateAsync(currentDate.ToString("yyyy-MM-dd"), expenseId).ConfigureAwait(false)) is not null;
            if (!paymentExists)
                lateDates.Add(currentDate.ToString("yyyy-MM-dd"));

            currentDate = BuilderUtils.GetNextDueDate(expense.RecurrenceRate, currentDate, expense.DueEndOfMonth);
        }

        return lateDates;
    }

    #endregion
    #region Private helpers
    
    private async Task HandleScheduledPaymentsUpdatesAsync(ExpenseDto expense, int? newAutomaticPayments, int? newIsActive, int? newAutomaticCreditCardId)
    {
        // User is turning on automatic payments. Schedule the next due date
        if (newAutomaticPayments == 1 && expense is { AutomaticPayments: false, NextDueDate: not null })
            await scheduledPaymentRepo.SchedulePaymentAsync(expense.Id, expense.NextDueDate).ConfigureAwait(false);

        // User if turning off automatic payments OR setting the expense inactive. Delete next scheduled payment.
        if ((newAutomaticPayments == 0 || newIsActive == 0) && expense is { AutomaticPayments: true, NextDueDate: not null })
            await scheduledPaymentRepo.DeleteScheduledPaymentByDueDateAsync(expense.Id, expense.NextDueDate).ConfigureAwait(false);
        
        // User is activating expense that has automatic payments. Schedule next payment.
        if (newIsActive == 1 && expense is { AutomaticPayments: true, NextDueDate: not null })
            await scheduledPaymentRepo.SchedulePaymentAsync(expense.Id, expense.NextDueDate).ConfigureAwait(false);
    }

    private static Dictionary<string, List<DashboardCalendarExpenseResponse>> MapExpensesForCalendarResponse(int year, int month, List<ExpenseDto> expenses)
    {
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var mappedExpenses = new Dictionary<string, List<DashboardCalendarExpenseResponse>>();
        for (var i = 1; i <= daysInMonth; i++)
        {
            var date = new DateOnly(year, month, i);
            mappedExpenses[date.ToString("yyyy-MM-dd")] = [];
            foreach (var expense in expenses)
            {
                if (BuilderUtils.ExpenseIsForDate(expense, date))
                {
                    mappedExpenses[date.ToString("yyyy-MM-dd")].Add(new DashboardCalendarExpenseResponse
                    {
                        Id = expense.Id,
                        Name = expense.Name,
                        Cost = expense.Cost,
                        CategoryName = expense.CategoryName,
                        NextDueDate = expense.NextDueDate,
                        RecurrenceRate = expense.RecurrenceRate,
                        CategoryId = expense.CategoryId,
                        Description = expense.Description,
                        StartDate = expense.StartDate,
                        EndDate = expense.EndDate,
                        DueLastDayOfMonth = expense.DueEndOfMonth,
                        AutomaticPayments = expense.AutomaticPayments,
                        AutomaticPaymentCreditCardId = expense.AutomaticPaymentCreditCardId,
                        AutomaticPaymentIgnoreCashBack = expense.AutomaticPaymentIgnoreCashBack,
                        AutomaticPaymentCashBackOverwrite = expense.AutomaticPaymentCashBackOverwrite,
                        OneTimeExpenseIsPaid = expense.OneTimeExpenseIsPaid
                    });
                }
            }
        }

        return mappedExpenses;
    }

    private async Task<Dictionary<string, List<DashboardUpcomingExpenseResponse>>> MapExpensesForUpcomingExpensesResponseAsync(DateOnly startDate, DateOnly endDate, List<ExpenseDto> expenses)
    {
        var mappedExpenses = new Dictionary<string, List<DashboardUpcomingExpenseResponse>>();
        for (var date = startDate; date < endDate; date = date.AddDays(1))
        {
            var paymentsForDate = await paymentRepo.GetPaymentsForDateAsync(date, userContext.UserId).ConfigureAwait(false);
            mappedExpenses[date.ToString("yyyy-MM-dd")] = [.. expenses
                .Where(e => BuilderUtils.ExpenseIsForDate(e, date) && paymentsForDate.All(p => p.ExpenseId != e.Id))
                .Select(expense => new DashboardUpcomingExpenseResponse
                {
                    Id = expense.Id,
                    Name = expense.Name,
                    Cost = expense.Cost,
                    RecurrenceRate = expense.RecurrenceRate,
                    StartDate = expense.StartDate,
                    EndDate = expense.EndDate,
                    NextDueDate = expense.NextDueDate,
                    AutomaticPayments = expense.AutomaticPayments,
                    DueEndOfMonth = expense.DueEndOfMonth
                })];
        }

        return mappedExpenses;
    }

    private async Task<bool> CheckExpenseHasLateDueDateAsync(ExpenseDto expense)
    {
        var hasLate = false;
        var currentDueDate = DateOnly.ParseExact(expense.StartDate, "yyyy-MM-dd");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        while (currentDueDate < today)
        {
            if (expense.EndDate is not null && currentDueDate > DateOnly.ParseExact(expense.EndDate, "yyyy-MM-dd"))
                break;
                
            var paymentExists = await paymentRepo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), expense.Id) is not null;
            if (!paymentExists)
                hasLate = true;
                
            currentDueDate = BuilderUtils.GetNextDueDate(expense.RecurrenceRate, currentDueDate, expense.DueEndOfMonth);
        }

        return hasLate;
    }
    
    #endregion
}
