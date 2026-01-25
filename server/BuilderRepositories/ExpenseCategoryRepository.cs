using DatabaseServices;
using DatabaseServices.Models;
using DatabaseServices.Repsonses;
using MySql.Data.MySqlClient;
using System.Data;

namespace BuilderRepositories;

public class ExpenseCategoryRepository : BuilderRepository
{
    private readonly DatabaseService _dbService;

    public ExpenseCategoryRepository(DatabaseService dbService) : base(dbService)
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

    public async Task<List<ExpenseCategoryDto>> GetExpenseCategoriesAsync(int userId, bool active)
    {
        var activeSql = active ? "AND active = 1" : "";
        var sql = $@"SELECT
                        *
                    FROM
                        expense_categories
                    WHERE user_id = @userId
                        {activeSql}
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
            UpdatedAt = row.Field<DateTime>("updated_at").ToString("yyyy-MM-dd") ?? string.Empty,
            Active = row.Field<bool>("active")
        }) ?? [];
    }

    public async Task DeleteExpenseCategoryAsync(int categoryId, int userId)
    {
        var sql = @"DELETE FROM expense_categories
                    WHERE id = @categoryId
                        AND user_id = @userId";
        var parameters = new Dictionary<string, object?>
        {
            { "@categoryId", categoryId },
            { "@userId", userId }
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }
    
    public async Task SetExpenseCategoryActiveStatusAsync(int categoryId, bool active, int userId)
    {
        var sql = @"UPDATE expense_categories
                    SET active = @active
                    WHERE id = @categoryId
                        AND user_id = @userId";
        var parameters = new Dictionary<string, object?>
        {
            { "@categoryId", categoryId },
            { "@active", active },
            { "@userId", userId }
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }
}
