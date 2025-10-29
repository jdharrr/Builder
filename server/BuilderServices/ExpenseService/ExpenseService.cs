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

    private readonly PaymentRepository _paymentRepo;

    private readonly UserContext _userContext;

    private readonly int _upcomingDaysLimit = 7;

    public ExpenseService(ExpenseRepository expenseRepo, PaymentRepository paymentRepo, UserContext userContext) 
    {
        _expenseRepo = expenseRepo;
        _paymentRepo = paymentRepo;
        _userContext = userContext;
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
        };

        if (request.EndOfTheMonth)
        {
            var year = int.Parse(expenseDto.StartDate[..4]);
            var month = int.Parse(expenseDto.StartDate.Substring(4, 2));
            expenseDto.StartDate = $"{year}-{month}-{DateTime.DaysInMonth(year, month)}";
        }

        var lastInsertedId = await _expenseRepo.CreateExpenseAsync(expenseDto, _userContext.UserId).ConfigureAwait(false);
        if (lastInsertedId == 0)
        {
            throw new GenericException("Failed to create expense");
        }

        if (request.IsPaidOnCreation)
        {
            var paymentDto = new ExpensePaymentDto
            {
                ExpenseId = (int)lastInsertedId,
                UserId = _userContext.UserId,
                PaymentDate = request.InitialDatePaid ?? DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd"),
                Cost = request.Cost,
                DueDatePaid = expenseDto.StartDate
            };

            await UpdatePaymentForDueDateAsync(paymentDto, true).ConfigureAwait(false);
        }

        return lastInsertedId;
    }

    public async Task UpdatePaymentForDueDateAsync(ExpensePaymentDto dto, bool isPaid)
    {
        if (dto.UserId == 0 )
            dto.UserId = _userContext.UserId;

        var expense = await _expenseRepo.GetExpenseByIdAsync(dto.ExpenseId, _userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense. Could not insert payment.");

        if (!ExpenseIsForDate(expense, DateOnly.ParseExact(dto.DueDatePaid, "yyyy-MM-dd")))
            throw new GenericException("Due date paid is not valid for this expense.");

        dto.Cost = expense.Cost;

        if (isPaid)
        {
            if (string.IsNullOrEmpty(dto.PaymentDate))
                dto.PaymentDate = DateTime.UtcNow.ToString("yyyy-MM-dd");

            var lastInsertedId = await _paymentRepo.CreateExpensePaymentAsync(dto).ConfigureAwait(false);
            if (lastInsertedId == 0)
                throw new GenericException("Failed to create payment for expense");
        }
        else
        {
            await _paymentRepo.DeleteExpensePaymentAsync(dto).ConfigureAwait(false);
        }

        var dueDatePaidObj = DateOnly.ParseExact(dto.DueDatePaid, "yyyy-MM-dd");
        var nextDueDateObj = DateOnly.ParseExact(expense.NextDueDate!, "yyyy-MM-dd");
        if (dueDatePaidObj >= nextDueDateObj)
        {
            try
            {
                await UpdateNextDueDateAsync(expense, isPaid).ConfigureAwait(false);
            } 
            catch
            {
                throw new GenericException("Failed to update next due date for expense");
            }
        }
    }

    public async Task UpdateNextDueDateAsync(ExpenseDto dto, bool isFuture)
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

            var paymentDto = new ExpensePaymentDto
            {
                ExpenseId = dto.Id,
                UserId = _userContext.UserId,
                DueDatePaid = currentDueDate.ToString("yyyy-MM-dd")
            };

            paymentExistsForDueDate = await _paymentRepo.GetExpensePaymentByDueDateAsync(paymentDto).ConfigureAwait(false) != null;
        }

        var updateDict3 = new Dictionary<string, object?>
        {
            { "next_due_date", currentDueDate.ToString("yyyy-MM-dd") }
        };
        await _expenseRepo.UpdateExpenseAsync(updateDict3, dto.Id, _userContext.UserId).ConfigureAwait(false);
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
                if (ExpenseIsForDate(expense, date))
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
        var endDate = startDate.AddDays(7);

        var expenses = await _expenseRepo.GetExpensesForDateRangeAsync(
            _userContext.UserId, 
            startDate, 
            endDate
        ).ConfigureAwait(false);

        var mappedExpenses = new Dictionary<string, List<ExpenseDto>>();
        for (DateOnly date = startDate; date < endDate; date = date.AddDays(1))
        {
            var paymentsForDate = await _paymentRepo.GetPaymentsForDateAsync(date, _userContext.UserId).ConfigureAwait(false);
            mappedExpenses[date.ToString("yyyy-MM-dd")] = [.. expenses.Where(e => ExpenseIsForDate(e, date) && !paymentsForDate.Any(p => p.ExpenseId == e.Id))];
        }

        return mappedExpenses;
    }

    public static bool ExpenseIsForDate(ExpenseDto dto, DateOnly date)
    {
        var startDate = DateOnly.ParseExact(dto.StartDate, "yyyy-MM-dd");
        var endDate = dto.EndDate != null ? DateOnly.ParseExact(dto.EndDate, "yyyy-MM-dd") : (DateOnly?)null;
        if (startDate > date || (endDate != null && endDate < date))
            return false;

        var diffDays = startDate.DayNumber - date.DayNumber;
        switch (dto.RecurrenceRate)
        {
            case "daily":
                return true;
            case "once":
                return startDate == date;
            case "weekly":
                return diffDays % 7 == 0;
            case "monthly":
                if (dto.DueEndOfMonth && date.Day == DateTime.DaysInMonth(date.Year, date.Month))
                    return true;
                if (date.Day == startDate.Day)
                    return true;
                return false;
            case "yearly":
                return date.Month == startDate.Month && date.Day == startDate.Day;
            default:
                return false;
        }
    }

    public async Task<List<ExpenseDto>> GetAllExpensesAsync(string sortColumn, string sortDir, string? searchColumn, string? searchValue, bool showInactive)
    {
        var expenses = await _expenseRepo.GetAllExpensesAsync(_userContext.UserId, sortColumn, sortDir, searchColumn, searchValue, showInactive).ConfigureAwait(false);
        foreach (var expense in expenses)
        {
            var recurrenceIsOnce = expense.RecurrenceRate == "once";
            expense.TableActions = new Dictionary<string, string>
            {
                { ExpenseTableAction.Pay.ToString(), ExpenseTableAction.Pay.GetActionText(recurrenceIsOnce) },
                { ExpenseTableAction.Unpay.ToString(), ExpenseTableAction.Unpay.GetActionText(recurrenceIsOnce) },
                { ExpenseTableAction.Delete.ToString(), ExpenseTableAction.Delete.GetActionText(recurrenceIsOnce) },
                { ExpenseTableAction.Edit.ToString(), ExpenseTableAction.Edit.GetActionText(recurrenceIsOnce) },
                { ExpenseTableAction.EditPayments.ToString(), ExpenseTableAction.EditPayments.GetActionText(recurrenceIsOnce) },
            };

            if (recurrenceIsOnce)
            {
                var paymentExists = (await _paymentRepo.GetPaymentsForExpenseAsync(expense.Id, _userContext.UserId).ConfigureAwait(false)).Count > 0;
                if (paymentExists)
                    expense.TableActions.Remove(ExpenseTableAction.Pay.ToString());
                else
                    expense.TableActions.Remove(ExpenseTableAction.Unpay.ToString());
            }

            if (expense.Active)
            {
                expense.TableActions[ExpenseTableAction.Inactive.ToString()] = ExpenseTableAction.Inactive.GetActionText(recurrenceIsOnce);
            }
            else
            {
                expense.TableActions[ExpenseTableAction.Active.ToString()] = ExpenseTableAction.Active.GetActionText(recurrenceIsOnce);
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

    public async Task UpdateExpenseActiveStatusAsync(int expenseId, bool isActive)
    {
        var updateDict = new Dictionary<string, object?>
        {
            { "active", isActive ? 1 : 0 }
        };

        await _expenseRepo.UpdateExpenseAsync(updateDict, expenseId, _userContext.UserId).ConfigureAwait(false);
    }

    public async Task<List<ExpensePaymentDto>> GetPaymentsForExpenseAsync(int expenseId)
    {
        return await _paymentRepo.GetPaymentsForExpenseAsync(expenseId, _userContext.UserId).ConfigureAwait(false);
    }

    public async Task DeleteExpenseAsync(int expenseId)
    {
        await _expenseRepo.DeleteExpenseAsync(expenseId, _userContext.UserId).ConfigureAwait(false);
    }

    public async Task<List<ExpenseDto>> GetLateExpensesAsync()
    {
        // TODO: Get late expenses by checking if payment for date exists,,, ?? dunno the thought process behind this anymore lol
        return await _expenseRepo.GetLateExpensesAsync(_userContext.UserId).ConfigureAwait(false);
    }

    public async Task<List<string>> GetLateDatesForExpense(int expenseId)
    {
        List<string> lateDates = [];

        var expense = await _expenseRepo.GetExpenseByIdAsync(expenseId, _userContext.UserId).ConfigureAwait(false)
            ?? throw new GenericException("Failed to find expense.");

        var startDate = expense.StartDate;
        var currentYear = int.Parse(startDate[..4]);
        var currentMonth = int.Parse(startDate.Substring(5,2));
        var currentDay = int.Parse(startDate.Substring(8,2));
        var currentDate = DateOnly.ParseExact(startDate, "yyyy-MM-dd");
        var today = DateOnly.FromDateTime(DateTime.Today);
        while(currentDate < today)
        {
            var dto = new ExpensePaymentDto()
            {
                UserId = _userContext.UserId,
                ExpenseId = expenseId,
                DueDatePaid = currentDate.ToString("yyyy-MM-dd")
            };
            var paymentExists = (await _paymentRepo.GetExpensePaymentByDueDateAsync(dto).ConfigureAwait(false)) != null;
            if (!paymentExists)
                lateDates.Add(currentDate.ToString("yyyy-MM-dd"));

            var daysInMonth = DateTime.DaysInMonth(currentYear, currentMonth);
            switch (expense.RecurrenceRate)
            {
                case "daily":
                    currentDay += 1;
                    if (currentDay > daysInMonth)
                    {
                        currentDay = 1;
                        currentMonth += 1;
                    }
                    break;
                case "weekly":
                    currentDay += 7;
                    if (currentDay > daysInMonth)
                    {
                        currentDay = 7 - daysInMonth - currentDay;
                        currentMonth += 1;
                    }
                    break;
                case "monthly":
                    currentMonth += 1;
                    break;
                case "yearly":
                    currentYear += 1;
                    break;
            }

            if (currentMonth > 12)
            {
                currentMonth = 1;
                currentYear += 1;
            }

            currentDate = DateOnly.ParseExact($"{currentYear}-{currentMonth.ToString().PadLeft(2, '0')}-{currentDay.ToString().PadLeft(2, '0')}", "yyyy-MM-dd");
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