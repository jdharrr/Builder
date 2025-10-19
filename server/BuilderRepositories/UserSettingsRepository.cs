using DatabaseServices;

namespace BuilderRepositories;

public class UserSettingsRepository
{
    private readonly DatabaseService _dbService;

    public UserSettingsRepository(DatabaseService dbService)
    {
        _dbService = dbService;
    }

    public async Task<bool> UpdateUserSettings(Dictionary<string, object?> updateColumns, int userId)
    {
        var allowedColumns = new HashSet<string>
        {
            "DarkMode",
        };

        if (updateColumns.Where(x => !allowedColumns.Contains(x.Key)).Any())
            throw new GenericException("Invalid update request.");

        var sql = "UPDATE user_settings SET ";

        foreach (var column in updateColumns.Keys)
        {
            sql += $"{column} = @{column},";
        }

        sql = sql.TrimEnd(',');
        sql += " WHERE user_id = @userId";

        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId }
        };

        foreach (var kvp in updateColumns)
        {
            parameters[$"@{kvp.Key}"] = kvp.Value;
        }

        var result = await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    
        return result.RowsAffected > 0;
    }
}
