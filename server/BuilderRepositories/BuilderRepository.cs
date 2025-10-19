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
}