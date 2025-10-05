using DatabaseServices;

namespace BuilderRepositories.ExpenseRepository;

public class ExpenseRepository
{
    private readonly DatabaseService _dbService;

    public ExpenseRepository(DatabaseService dbService)
    {
        _dbService = dbService;
    }
}
