using DatabaseServices;
using DatabaseServices.Models;
using DatabaseServices.Repsonses;
using MySql.Data.MySqlClient;
using System.Data;

namespace BuilderRepositories;

public class ExpenseCategoryRepository
{
    private readonly DatabaseService _dbService;

    public ExpenseCategoryRepository(DatabaseService dbService)
    {
        _dbService = dbService;
    }

    public async Task<int> CreateExpenseCategoryAsync(string categoryName, int userId)
    {
        var sql = @"INSERT INTO expense_categories (
                        name,
                        user_id
                    ) VALUES (
                        @categoryName,
                        @userId
                    )";
        var parameters = new Dictionary<string, object?>()
        {
            { "@categoryName", categoryName },
            { "@userId", userId }
        };

        ExecuteResponse result;
        try
        {
            result = await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
        }
        catch (MySqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
        {
            if (ex.Message.Contains("name"))
            {
                throw new GenericException("An expense category with this name already exists.");
            }

            throw;
        }
        catch (MySqlException ex) when (ex.Number == 45000)
        {
            throw new GenericException(ex.Message);
        }

        return result.RowsAffected;
    }

    public async Task<List<ExpenseCategoryDto>> GetExpenseCategoriesAsync(int userId)
    {
        var sql = @"SELECT
                        *
                    FROM
                        expense_categories
                    WHERE user_id = @userId
                        AND active = 1
                    ORDER BY name ASC
                  ";
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new ExpenseCategoryDto
        {
            Id = row.Field<int>("id"),
            Name = row.Field<string>("name") ?? string.Empty,
            CreatedAt = row.Field<DateTime>("created_at").ToString("yyyy-MM-dd") ?? string.Empty,
            UpdatedAt = row.Field<DateTime>("updated_at").ToString("yyyy-MM-dd") ?? string.Empty
        }) ?? [];
    }

    public async Task<List<ExpenseCategoryDto>> GetExpenseCategoriesWithTotalSpentAsync(int userId, DateOnly? startOfRange = null, DateOnly? endOfRange = null)
    {
        var rangeSql = startOfRange != null && endOfRange != null
            ? @"AND ep.payment_date >= @startOfRange
                AND ep.payment_date <= @endOfRange
               "
            : "";
        var sql = $@"SELECT ec.name, ec.id, COALESCE(SUM(ep.cost), 0.0) AS total_spent
                    FROM expense_categories ec
                    INNER JOIN expenses e
                        ON e.category_id = ec.id
                        AND e.user_id = @userId
                    LEFT JOIN expense_payments ep
                        ON ep.expense_id = e.id
                    WHERE ec.user_id = @userIdCopy
                        AND ec.active = 1
                        {rangeSql}
                    GROUP BY ec.id, ec.name
                    ORDER BY ec.id";
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId },
            { "@userIdCopy", userId }
        };

        if (startOfRange != null & endOfRange != null)
        {
            parameters["@startOfRange"] = startOfRange?.ToString("yyyy-MM-dd");
            parameters["@endOfRange"] = endOfRange?.ToString("yyyy-MM-dd");
        }

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new ExpenseCategoryDto
        {
            Id = row.Field<int>("id"),
            Name = row.Field<string>("name") ?? string.Empty,
            TotalSpent = (double)row.Field<decimal>("total_spent")
        }) ?? [];
    }
}
