using DatabaseServices;
using DatabaseServices.Models;
using DatabaseServices.Repsonses;
using MySql.Data.MySqlClient;
using System.Data;
using BuilderRepositories.Requests;
using BuilderServices.Enums;

namespace BuilderRepositories;

public class ExpensePaymentRepository: BuilderRepository
{
    private readonly DatabaseService _dbService;

    public ExpensePaymentRepository(DatabaseService dbService): base(dbService)
    {
        _dbService = dbService;
    }

    public async Task<long> CreateExpensePaymentAsync(int expenseId, string paymentDate, string dueDatePaid, bool isSkipped, decimal cost, int? creditCardId = null, int? scheduledPaymentId = null)
    {
        var sql = @"INSERT INTO expense_payments (
                    expense_id,
                    cost,
                    payment_date,
                    due_date_paid,
                    skipped,
                    credit_card_id,
                    scheduled_payment_id
                ) VALUES(
                    @expenseId,
                    @cost,
                    @paymentDate,
                    @dueDatePaid,
                    @isSkipped,
                    @creditCardId,
                    @scheduledPaymentId
                )";
        var parameters = new Dictionary<string, object?>()
        {
            { "@expenseId", expenseId },
            { "@cost", cost },
            { "@paymentDate", paymentDate },
            { "@dueDatePaid", dueDatePaid },
            { "@isSkipped", isSkipped ? 1 : 0 },
            { "@creditCardId", creditCardId },
            { "@scheduledPaymentId", scheduledPaymentId }
        };

        var result = new ExecuteResponse();
        try 
        {
            result = await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
        }
        catch (MySqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
        {
            if (ex.Message.Contains("user_expense_duedatepaid"))
            {
                throw new GenericException("This expense due date has already been paid.");
            }
        }

        return result.LastInsertedId;
    }

    public async Task<bool> DeleteExpensePaymentsAsync(List<object> paymentIds)
    {
        var parameters = new Dictionary<string, object?>();
        var sql = $@"DELETE FROM expense_payments
                    WHERE id IN ({BuildInParams(paymentIds, ref parameters)})";
        
        var result = await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
        return result.RowsAffected > 0;
    }

    public async Task<ExpensePaymentDto?> GetExpensePaymentByDueDateAsync(string dueDate, int expenseId)
    {
        var sql = @"SELECT id, expense_id, cost, payment_date, due_date_paid FROM expense_payments
                    WHERE due_date_paid = @dueDate
                        AND expense_id = @expenseId";
        var parameters = new Dictionary<string, object?>()
        {
            { "@dueDate", dueDate },
            { "@expenseId", expenseId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapSingle(row => new ExpensePaymentDto
        {
            Id = row.Field<int>("id"),
            ExpenseId = row.Field<int>("expense_id"),
            Cost = row.Field<decimal>("cost"),
            PaymentDate = row.Field<DateTime>("payment_date").ToString("yyyy-MM-dd") ?? string.Empty,
            DueDatePaid = row.Field<DateTime>("due_date_paid").ToString("yyyy-MM-dd") ?? string.Empty
        });
    }

    public async Task<List<ExpensePaymentDto>> GetPaymentsForDateAsync(DateOnly dueDatePaid, int userId)
    {
        var sql = @"SELECT * FROM expense_payments ep
                    INNER JOIN expenses e
                        ON e.user_id = @userId
                        AND ep.expense_id = e.id
                    WHERE ep.due_date_paid = @dueDatePaid";
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId },
            { "@dueDatePaid", dueDatePaid.ToString("yyyy-MM-dd") }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new ExpensePaymentDto
        {
            Id = row.Field<int>("id"),
            ExpenseId = Convert.ToInt32(row["expense_id"]),
            Cost = row.Field<decimal>("cost"),
            PaymentDate = row.Field<DateTime>("payment_date").ToString("yyyy-MM-dd"),
            DueDatePaid = row.Field<DateTime>("due_date_paid").ToString("yyyy-MM-dd")
        }) ?? [];
    }

    public async Task<List<ExpensePaymentDto>> GetPaymentsForExpenseAsync(int expenseId)
    {
        var sql = @"SELECT * FROM expense_payments
                    WHERE expense_id = @expenseId
                  ";
        var parameters = new Dictionary<string, object?>()
        {
            { "@expenseId", expenseId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);
        
        return dataTable.MapList(row => new ExpensePaymentDto
        {
            Id = row.Field<int>("id"),
            ExpenseId = Convert.ToInt32(row["expense_id"]),
            Cost = row.Field<decimal>("cost"),
            PaymentDate = row.Field<DateTime>("payment_date").ToString("yyyy-MM-dd"),
            DueDatePaid = row.Field<DateTime>("due_date_paid").ToString("yyyy-MM-dd"),
            Skipped = row.Field<bool>("skipped")
        }) ?? [];
    }

    public async Task<decimal> GetTotalSpentForRangeAsync(int userId, string? startDate = null, string? endDate = null, int? categoryId = null)
    {
        var sql = @"SELECT COALESCE(SUM(ep.cost), 0.0) AS total_spent 
                    FROM expense_payments ep
                    INNER JOIN expenses e
                        ON e.user_id = @userId
                        AND ep.expense_id = e.id
                    WHERE skipped = 0";

        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId }
        };

        if (startDate != null && endDate != null)
        {
            sql += " AND ep.payment_date >= @startDate AND ep.payment_date <= @endDate";
            parameters.Add("@startDate", startDate);
            parameters.Add("@endDate", endDate);
        }

        if (categoryId != null)
        {
            sql += " AND e.category_id = @categoryId";
            parameters.Add("@categoryId", categoryId);
        }

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable?.MapSingle(row => row.Field<decimal>("total_spent")) ?? 0;
    }
    
    public async Task<List<ExpenseCategoryDto>> GetCategoryTotalSpentByRangeAsync(int userId, string? startOfRange = null, string? endOfRange = null)
    {
        var rangeSql = startOfRange != null && endOfRange != null
            ? @"AND DATE(ep.payment_date) >= @startOfRange
                AND DATE(ep.payment_date) <= @endOfRange
               "
            : "";
        var sql = $@"SELECT 
                        COALESCE(ec.name, 'No Category') AS name, 
                        COALESCE(ec.id, 0) AS id, 
                        COALESCE(SUM(ep.cost), 0.0) AS category_total_spent
                     FROM expense_payments ep
                     INNER JOIN expenses e
                        ON ep.expense_id = e.id
                        AND e.user_id = @userId
                     LEFT JOIN expense_categories ec
                        ON e.category_id = ec.id
                        AND ec.active = 1
                     WHERE ep.skipped = 0
                        {rangeSql}
                     GROUP BY ec.id, ec.name";
        var parameters = new Dictionary<string, object?>
        {
            { "@userId", userId }
            
        };

        if (startOfRange != null & endOfRange != null)
        {
            parameters["@startOfRange"] = startOfRange;
            parameters["@endOfRange"] = endOfRange;
        }

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new ExpenseCategoryDto
        {
            Id = Convert.ToInt32(row["id"]),
            Name = row.Field<string>("name") ?? string.Empty,
            CategoryTotalSpent = row.Field<decimal>("category_total_spent")
        }) ?? [];
    }

    public async Task<List<ExpensePaymentDto>> GetAllPaymentsForTableAsync(int userId, string sortColumn, string sortDir, string? searchColumn, string? searchValue, bool showSkipped, List<TableFilter> filters)
    {
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId }
        };
        
        var selectFrom = @"SELECT 
                               ep.*, 
                               cc.credit_company,
                               e.name AS expense_name,
                               e.id AS expense_id
                           FROM expense_payments ep";
        var join = @" INNER JOIN expenses e
                         ON ep.expense_id = e.id
                      LEFT JOIN credit_cards cc 
                         ON ep.credit_card_id = cc.id ";
        var where = " WHERE e.user_id = @userId";
        if (!showSkipped)
            where += "  AND ep.skipped = 0";
        
        AddTableSearch(ref where, ref parameters, searchColumn, searchValue);
        AddTableFilters(ref where, ref parameters, filters);
        var orderBy = AddTableSort(sortDir, sortColumn);

        var sql = selectFrom + join + where + orderBy;

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new ExpensePaymentDto
        {
            Id = Convert.ToInt32(row["id"]),
            ExpenseId = row.Field<int>("expense_id"),
            Cost = row.Field<decimal>("cost"),
            PaymentDate = row.Field<DateTime>("payment_date").ToString("yyyy-MM-dd"),
            DueDatePaid = row.Field<DateTime>("due_date_paid").ToString("yyyy-MM-dd"),
            Skipped = row.Field<bool>("skipped"),
            CreditCard = row.Field<string>("credit_company"),
            ExpenseName = row.Field<string>("expense_name") ?? string.Empty
        }) ?? [];
    }

    private static void AddTableSearch(ref string where, ref Dictionary<string, object?> parameters, string? searchColumn, string? searchValue)
    {
        if (string.IsNullOrEmpty(searchColumn) || string.IsNullOrEmpty(searchValue)) return;
        
        // TODO: sanitize search value to prevent
        var searchCol = searchColumn switch
        {
            "expense_name" => "e.name",
            "credit_card" => "cc.credit_company",
            _ => $"ep.{searchColumn}"
        };
        where += $" AND {searchCol} LIKE @searchValue";

        var escapedSearchValue = searchValue.Replace("%", "\\%").Replace("_", "\\_");
        parameters["@searchValue"] = $"%{escapedSearchValue}%";
    }
    
    private static void AddTableFilters(ref string where, ref Dictionary<string, object?> parameters, List<TableFilter> filters)
    {
        if (filters.Count <= 0) return;
        
        var i = 0;
        foreach (var filter in filters)
        {
            if (string.IsNullOrEmpty(filter.Value1))
                continue;
                
            switch (filter.FilterType)
            {
                case TableFilterType.Text:
                    var filterCol = filter.FilterColumn switch
                    {
                        "expense_name" => "e.name",
                        "credit_company" => "cc.credit_company",
                        _ => $"ep.{filter.FilterColumn}"
                    };
                    where += $" AND {filterCol} like @filterValue{i}";
                        
                    var escapedFilterValue = filter.Value1.Replace("%", "\\%").Replace("_", "\\_");
                    parameters[$"@filterValue{i}"] = $"%{escapedFilterValue}%";
                    break;
                case TableFilterType.DateRange:
                    if (!DateOnly.TryParse(filter.Value1, out var _))
                        continue;

                    where += $" AND ep.{filter.FilterColumn} >= @dateFrom{i}";
                    parameters[$"@dateFrom{i}"] = filter.Value1;

                    if (string.IsNullOrEmpty(filter.Value2) || !DateOnly.TryParse(filter.Value2, out var _))
                        break;

                    where += $" AND ep.{filter.FilterColumn} <= @dateTo{i}";
                    parameters[$"@dateTo{i}"] = filter.Value2;
                        
                    break;
                case TableFilterType.NumberRange:
                    if (!double.TryParse(filter.Value1, out var _))
                        continue;
                        
                    where += $" AND ep.{filter.FilterColumn} >= @numMin{i}";
                    parameters[$"@numMin{i}"] = filter.Value1;

                    if (string.IsNullOrEmpty(filter.Value2) || !double.TryParse(filter.Value2, out var _))
                        break;

                    where += $" AND ep.{filter.FilterColumn} <= @numMax{i}";
                    parameters[$"@numMax{i}"] = filter.Value2;
                        
                    break;
            }

            i++;
        }
    }

    private static string AddTableSort(string sortDir, string sortColumn)
    {
        var sortDirection = sortDir.ToLower() == "asc" ? "ASC" : "DESC";
        var sortCol = sortColumn switch
        {
            "expense_name" => "e.name",
            "credit_card" => "cc.credit_company",
            _ => $"ep.{sortColumn}"
        };

        return $" ORDER BY {sortCol} {sortDirection}, ep.id DESC";
    }
}
