using DatabaseServices;

namespace BuilderRepositories;

public class BuilderRepository
{
    private readonly DatabaseService _dbService;

    public BuilderRepository(DatabaseService dbService) 
    { 
        _dbService = dbService;
    }

    public async Task BeginTransactionAsync()
    {
        await _dbService.BeginTransactionAsync().ConfigureAwait(false);
    }

    public async Task CommitTransactionAsync()
    {
        await _dbService.CommitAsync().ConfigureAwait(false);
    }

    public async Task RollbackTransactionAsync()
    {
        await _dbService.RollbackAsync().ConfigureAwait(false);
    }

    public static string BuildInParams<T>(List<T> inList, ref Dictionary<string, object?> parameters)
    {
        var sql = "";
        for (int i = 0; i < inList.Count; i++)
        {
            sql += $"@param{i}";
            if (i < inList.Count - 1)
                sql += ",";

            parameters[$"param{i}"] = inList[i]; 
        }

        return sql;
    }
}
