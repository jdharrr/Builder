using DatabaseServices;
using DatabaseServices.Models;
using DatabaseServices.Repsonses;
using MySql.Data.MySqlClient;
using System.Data;
using BuilderRepositories.Requests;
using BuilderServices.Enums;
using Mysqlx.Resultset;

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

    public async Task<bool> DeleteExpensePaymentsAsync(List<int> paymentIds)
    {
        var parameters = new Dictionary<string, object?>();
        var sql = $@"DELETE FROM expense_payments
                    WHERE id IN ({BuildInParams(paymentIds, ref parameters)})";
        
        var result = await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
        return result.RowsAffected > 0;
    }
    
    public async Task<bool> DeleteExpensePaymentByIdAsync(int paymentId)
    {
        var sql = $@"DELETE FROM expense_payments
                    WHERE id = @paymentId";
        var parameters = new Dictionary<string, object?>
        {
            { "@paymentId", paymentId }
        };
        
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

        if (startDate is not null && endDate is not null)
        {
            sql += " AND ep.payment_date >= @startDate AND ep.payment_date <= @endDate";
            parameters.Add("@startDate", startDate);
            parameters.Add("@endDate", endDate);
        }

        if (categoryId is not null)
        {
            sql += " AND e.category_id = @categoryId";
            parameters.Add("@categoryId", categoryId);
        }

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable?.MapSingle(row => row.Field<decimal>("total_spent")) ?? 0;
    }
    
    public async Task<List<ExpenseCategoryDto>> GetCategoryTotalSpentByRangeAsync(int userId, string? startOfRange = null, string? endOfRange = null)
    {
        var rangeSql = startOfRange is not null && endOfRange is not null
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

        if (startOfRange is not null & endOfRange is not null)
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
                               ec.name AS category_name,
                               cc.credit_company,
                               e.name AS expense_name,
                               e.id AS expense_id,
                               e.recurrence_rate
                           FROM expense_payments ep";
        var join = @" INNER JOIN expenses e
                         ON ep.expense_id = e.id
                      INNER JOIN expense_categories ec
                         ON e.category_id = ec.id
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
            ExpenseName = row.Field<string>("expense_name") ?? string.Empty,
            Category = row.Field<string>("category_name") ?? string.Empty,
            RecurrenceRate = row.Field<string>("recurrence_rate") ?? string.Empty
        }) ?? [];
    }

    private static void AddTableSearch(ref string where, ref Dictionary<string, object?> parameters, string? searchColumn, string? searchValue)
    {
        if (string.IsNullOrEmpty(searchColumn) || string.IsNullOrEmpty(searchValue)) return;
        
        var searchCol = searchColumn switch
        {
            "expense_name" => "e.name",
            "credit_card" => "cc.credit_company",
            "category_name" => "ec.name",
            "recurrence_rate" => "e.recurrence_rate",
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
                        "category_name" => "ec.name",
                        "recurrence_rate" => "e.recurrence_rate",
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
            "category_name" => "ec.name",
            "recurrence_rate" => "e.recurrence_rate",
            _ => $"ep.{sortColumn}"
        };

        return $" ORDER BY {sortCol} {sortDirection}, ep.id DESC";
    }

    public async Task<Dictionary<string, decimal>> GetAvgSpentForCategoriesAsync(int userId, int year)
    {
        var isCurrentYear = DateTime.Today.Year == year;
        var maxMonthStart = new DateOnly(year, isCurrentYear ? DateTime.Today.Month : 12, 1);
        var startDate = new DateOnly(year, 1, 1);
        var endDate = isCurrentYear ? maxMonthStart.AddMonths(1) : new DateOnly(year + 1, 1, 1);

        var sql = @"WITH RECURSIVE months AS (
                      SELECT MAKEDATE(@year, 1) AS month_start
                      UNION ALL
                      SELECT month_start + INTERVAL 1 MONTH
                      FROM months
                      WHERE month_start < @maxMonthStart
                    ),
                    categories AS (
                      SELECT DISTINCT COALESCE(ec.name, 'No Category') AS category
                      FROM expenses e
                      LEFT JOIN expense_categories ec 
                        ON ec.id = e.category_id
                      WHERE e.user_id = @userId
                    ),
                    month_totals AS (
                      SELECT
                        DATE_FORMAT(ep.payment_date, '%Y-%m-01') AS month_start,
                        COALESCE(ec.name, 'No Category') AS category,
                        SUM(ep.cost) AS totalSpent
                      FROM expenses e
                      JOIN expense_payments ep 
                        ON ep.expense_id = e.id
                      LEFT JOIN expense_categories ec 
                        ON ec.id = e.category_id
                      WHERE e.user_id = @userId
                        AND ep.payment_date >= @startDate
                        AND ep.payment_date <  @endDate
                      GROUP BY month_start, category
                    ),
                    month_category AS (
                      SELECT m.month_start, c.category
                      FROM months m
                      CROSS JOIN categories c
                    )
                    SELECT
                      mc.category,
                      AVG(COALESCE(mt.totalSpent, 0)) AS avgMonthlySpent
                    FROM month_category mc
                    LEFT JOIN month_totals mt
                      ON mt.month_start = mc.month_start
                     AND mt.category = mc.category
                    GROUP BY mc.category
                    ORDER BY mc.category";
        var parameters = new Dictionary<string, object?>
        {
            { "@userId", userId },
            { "@year", year },
            { "@maxMonthStart", maxMonthStart.ToString("yyyy-MM-dd") },
            { "@startDate", startDate.ToString("yyyy-MM-dd") },
            { "@endDate", endDate.ToString("yyyy-MM-dd") }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        var result = new Dictionary<string, decimal>();

        foreach (DataRow r in dataTable.Rows)
        {
            var category = r.Field<string>("category") ?? "Unknown Category";
            var avgObj = r["avgMonthlySpent"];

            var avg = avgObj is decimal d ? d : Convert.ToDecimal(avgObj);

            result[category] = avg;
        }

        return result;
    }

    public async Task<ExpensePaymentDto?> GetExpensePaymentByIdAsync(int paymentId)
    {
        var sql = @"SELECT
                        *
                    FROM expense_payments ep
                    WHERE id = @paymentId";
        var parameters = new Dictionary<string, object?>
        {
            { "@paymentId", paymentId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapSingle(row => new ExpensePaymentDto()
        {
            Id = row.Field<int>("id"),
            CreditCardId = row.Field<int?>("credit_card_id"),
            Cost = row.Field<decimal>("cost")
        });
    }
}
