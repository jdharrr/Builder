using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.ExpenseService.Enums;
using BuilderServices.ExpenseService.Requests;
using DatabaseServices.Models;
using MySql.Data.MySqlClient;

namespace BuilderServices.ExpenseService;

public class ExpenseService
{
    private readonly ExpenseRepository _expenseRepo;

    private readonly ExpensePaymentRepository _paymentRepo;

    private readonly ScheduledPaymentRepository _scheduledPaymentRepo;

    private readonly UserContext _userContext;

    private readonly int _upcomingDaysLimit = 7;

    public ExpenseService(ExpenseRepository expenseRepo, ExpensePaymentRepository paymentRepo, UserContext userContext, ScheduledPaymentRepository scheduledPaymentRepo) 
    {
        _expenseRepo = expenseRepo;
        _paymentRepo = paymentRepo;
        _userContext = userContext;
        _scheduledPaymentRepo = scheduledPaymentRepo;
    }

    public async Task<long> CreateExpenseAsync(CreateExpenseRequest request)
    {
        var expenseDto = new ExpenseDto
        {
            Name = request.Name,
            Cost = request.Cost,
            Description = request.Description,
            RecurrenceRate = request.RecurrenceRate,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            DueEndOfMonth = request.EndOfTheMonth,
            CategoryId = request.CategoryId,
            AutomaticPayments = request.IsAutomaticPayment,
            AutomaticPaymentCreditCardId = request.AutomaticPaymentCreditCardId
        };

        if (request.EndOfTheMonth)
        {
            var year = int.Parse(expenseDto.StartDate[..4]);
            var month = int.Parse(expenseDto.StartDate.Substring(4, 2));
            expenseDto.StartDate = $"{year}-{month}-{DateTime.DaysInMonth(year, month)}";
        }

        var currentDueDate = DateOnly.ParseExact(expenseDto.StartDate, "yyyy-MM-dd");
        var today = DateOnly.FromDateTime(DateTime.Today);
        while (currentDueDate < today)
        {
            currentDueDate = expenseDto.RecurrenceRate switch
            {
                "daily" => currentDueDate.AddDays(1),

                "weekly" => currentDueDate.AddDays(7),

                "monthly" => currentDueDate.AddMonths(1),

                "yearly" => currentDueDate.AddYears(1),

                _ => currentDueDate,
            };
        }

        expenseDto.NextDueDate = currentDueDate.ToString("yyyy-MM-dd");
        
        var lastInsertedId = await _expenseRepo.CreateExpenseAsync(expenseDto, _userContext.UserId).ConfigureAwait(false);
        if (lastInsertedId == 0)
        {
            throw new GenericException("Failed to create expense");
        }

        if (request.IsAutomaticPayment)
            await _scheduledPaymentRepo.SchedulePaymentAsync((int)lastInsertedId, expenseDto.NextDueDate, request.AutomaticPaymentCreditCardId).ConfigureAwait(false);

        return lastInsertedId;
    }

    public async Task<Dictionary<string, List<ExpenseDto>>> GetExpensesForDashboardCalendarAsync(int year, int month)
    {
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var firstDate = new DateOnly(year, month, 1);
        var lastDate = new DateOnly(year, month, daysInMonth);

        var expenses = await _expenseRepo.GetExpensesForDateRangeAsync(_userContext.UserId, firstDate, lastDate).ConfigureAwait(false);

        var mappedExpenses = new Dictionary<string, List<ExpenseDto>>();
        for (int i = 1; i <= daysInMonth; i++)
        {
            var date = new DateOnly(year, month, i);
            mappedExpenses[date.ToString("yyyy-MM-dd")] = [];
            foreach (var expense in expenses)
            {
                if (BuilderUtils.ExpenseIsForDate(expense, date))
                {
                    mappedExpenses[date.ToString("yyyy-MM-dd")].Add(expense);
                }
            }
        }

        return mappedExpenses;
    }

    public async Task<Dictionary<string, List<ExpenseDto>>> GetUpcomingExpensesAsync()
    {
        var startDate = DateOnly.FromDateTime(DateTime.Today);
        var endDate = startDate.AddDays(_upcomingDaysLimit);

        var expenses = await _expenseRepo.GetExpensesForDateRangeAsync(
            _userContext.UserId, 
            startDate, 
            endDate
        ).ConfigureAwait(false);

        var mappedExpenses = new Dictionary<string, List<ExpenseDto>>();
        for (DateOnly date = startDate; date < endDate; date = date.AddDays(1))
        {
            var paymentsForDate = await _paymentRepo.GetPaymentsForDateAsync(date, _userContext.UserId).ConfigureAwait(false);
            mappedExpenses[date.ToString("yyyy-MM-dd")] = [.. expenses.Where(e => BuilderUtils.ExpenseIsForDate(e, date) && !paymentsForDate.Any(p => p.ExpenseId == e.Id))];
        }

        return mappedExpenses;
    }

    public async Task<List<ExpenseDto>> GetAllExpensesForTableAsync(string sortColumn, string sortDir, string? searchColumn, string? searchValue, bool showInactive)
    {
        var expenses = await _expenseRepo.GetAllExpensesForTableAsync(_userContext.UserId, sortColumn, sortDir, searchColumn, searchValue, showInactive).ConfigureAwait(false);
        foreach (var expense in expenses)
        {
            var recurrenceIsOnce = expense.RecurrenceRate == "once";
            expense.TableActions = new Dictionary<string, string>();
            if (expense.Active)
            {
                expense.TableActions[ExpenseTableAction.Inactive.ToString()] = ExpenseTableAction.Inactive.GetActionText(recurrenceIsOnce);
                expense.TableActions[ExpenseTableAction.Pay.ToString()] = ExpenseTableAction.Pay.GetActionText(recurrenceIsOnce);
            }
            else
            {
                expense.TableActions[ExpenseTableAction.Active.ToString()] = ExpenseTableAction.Active.GetActionText(recurrenceIsOnce);
            }
            expense.TableActions[ExpenseTableAction.Unpay.ToString()] = ExpenseTableAction.Unpay.GetActionText(recurrenceIsOnce);
            expense.TableActions[ExpenseTableAction.Edit.ToString()] = ExpenseTableAction.Edit.GetActionText(recurrenceIsOnce);
            expense.TableActions[ExpenseTableAction.Delete.ToString()] = ExpenseTableAction.Delete.GetActionText(recurrenceIsOnce);

            if (recurrenceIsOnce)
            {
                var paymentExists = (await _paymentRepo.GetPaymentsForExpenseAsync(expense.Id).ConfigureAwait(false)).Count > 0;
                if (paymentExists)
                    expense.TableActions.Remove(ExpenseTableAction.Pay.ToString());
                else
                    expense.TableActions.Remove(ExpenseTableAction.Unpay.ToString());
            }
        }

        return expenses;
    }

    public static Dictionary<string, string> GetSortOptions()
    {
        var sortOptions = new Dictionary<string, string>();
        foreach (var option in Enum.GetValues<ExpenseSortOption>())
        {
            sortOptions[option.ToString()] = option.GetDisplayName();
        }

        return sortOptions;
    }

    public static Dictionary<string, string> GetSearchColumns()
    {
        // Keep expected order for frontend
        return new Dictionary<string, string>()
        {
            { ExpenseSearchColumn.CreatedDate.ToString(), ExpenseSearchColumn.CreatedDate.GetDisplayName() },
            { ExpenseSearchColumn.UpdatedDate.ToString(), ExpenseSearchColumn.UpdatedDate.GetDisplayName() },
            { ExpenseSearchColumn.Category.ToString(), ExpenseSearchColumn.Category.GetDisplayName() },
            { ExpenseSearchColumn.Name.ToString(), ExpenseSearchColumn.Name.GetDisplayName() },
            { ExpenseSearchColumn.Cost.ToString(), ExpenseSearchColumn.Cost.GetDisplayName() },
            { ExpenseSearchColumn.NextDueDate.ToString(), ExpenseSearchColumn.NextDueDate.GetDisplayName() },
            { ExpenseSearchColumn.RecurrenceRate.ToString(), ExpenseSearchColumn.RecurrenceRate.GetDisplayName() },
            { ExpenseSearchColumn.StartDate.ToString(), ExpenseSearchColumn.StartDate.GetDisplayName() },
            { ExpenseSearchColumn.EndDate.ToString(), ExpenseSearchColumn.EndDate.GetDisplayName() },
        };
    }

    public async Task UpdateExpenseAsync(int expenseId, string? name = null, double? cost = null,
        string? startDate = null, string? endDate = null, int? categoryId = null, string? description = null, int? active = null)
    {
        if (active != null && active != 1 && active != 0)
            throw new GenericException("Invalid value for active field");
        
        var values = new
        {
            name,
            cost,
            start_date = startDate,
            end_date = endDate,
            category_id = categoryId,
            description,
            active
        };

        var updateDict = new Dictionary<string, object?>();
        foreach (var prop in values.GetType().GetProperties())
        {
            var value = prop.GetValue(values);
            if (value != null)
            {
                updateDict[prop.Name] = value;
            }
        }

        await _expenseRepo.UpdateExpenseAsync(updateDict, expenseId, _userContext.UserId);
    }

    public async Task DeleteExpenseAsync(int expenseId)
    {
        await _expenseRepo.DeleteExpenseAsync(expenseId, _userContext.UserId).ConfigureAwait(false);
    }

    public async Task<List<ExpenseDto>> GetLateExpensesAsync()
    {
        var expenses = await _expenseRepo.GetAllExpensesAsync(_userContext.UserId);

        var lateExpenses = new List<ExpenseDto>();
        foreach (var expense in expenses)
        {
            var hasLate = false;
            var currentDueDate = DateOnly.ParseExact(expense.StartDate, "yyyy-MM-dd");
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            while (currentDueDate < today)
            {
                if (expense.EndDate != null && currentDueDate > DateOnly.ParseExact(expense.EndDate, "yyyy-MM-dd"))
                    break;
                
                var paymentExists = await _paymentRepo.GetExpensePaymentByDueDateAsync(currentDueDate.ToString("yyyy-MM-dd"), expense.Id) != null;
                if (!paymentExists)
                    hasLate = true;
                
                currentDueDate = expense.RecurrenceRate switch
                {
                    "daily" => currentDueDate.AddDays(1),

                    "weekly" => currentDueDate.AddDays(7),

                    "monthly" => currentDueDate.AddMonths(1),

                    "yearly" => currentDueDate.AddYears(1),

                    _ => currentDueDate,
                };
            }

            if (hasLate)
                lateExpenses.Add(expense);
        }

        return lateExpenses;
    }

    public async Task<List<string>> GetLateDatesForExpense(int expenseId)
    {
        List<string> lateDates = [];

        var expense = await _expenseRepo.GetExpenseByIdAsync(expenseId, _userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense.");

        DateOnly? endDate = expense.EndDate != null ? DateOnly.ParseExact(expense.EndDate, "yyyy-MM-dd") : null;
        var currentDate = DateOnly.ParseExact(expense.StartDate, "yyyy-MM-dd");
        var today = DateOnly.FromDateTime(DateTime.Today);
        while(currentDate < today && (endDate == null || currentDate <= endDate))
        {
            var paymentExists = (await _paymentRepo.GetExpensePaymentByDueDateAsync(currentDate.ToString("yyyy-MM-dd"), expenseId).ConfigureAwait(false)) != null;
            if (!paymentExists)
                lateDates.Add(currentDate.ToString("yyyy-MM-dd"));

            currentDate = expense.RecurrenceRate switch
            {
                "daily" => currentDate.AddDays(1),

                "weekly" => currentDate.AddDays(7),

                "monthly" => currentDate.AddMonths(1),

                "yearly" => currentDate.AddYears(1),

                _ => currentDate,
            };
        }

        return lateDates;
    }

    public static Dictionary<string, string> GetExpenseTableBatchActions()
    {
        var actions = new Dictionary<string, string>()
        {
            { ExpenseTableBatchAction.UpdateCategory.ToString(), ExpenseTableBatchAction.UpdateCategory.GetDisplayName() }
        };

        return actions;
    }
}  