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

        return result.RowsAffected;
    }

    public async Task<List<ExpenseCategoryDto>> GetExpenseCategoriesAsync(int userId)
    {
        var sql = @"SELECT
                        *
                    FROM
                        expense_categories
                    WHERE
                        user_id = @userId
                    ORDER BY
                        name ASC
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
            CreatedAt = row.Field<DateTime>("created_at").ToString("yyyy-mm-dd") ?? string.Empty,
            UpdatedAt = row.Field<DateTime>("updated_at").ToString("yyyy-mm-dd") ?? string.Empty
        });
    }
}
