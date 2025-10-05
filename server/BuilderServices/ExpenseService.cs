using BuilderRepositories.ExpenseRepository;

namespace BuilderServices;

public class ExpenseService
{
    private readonly ExpenseRepository _repo;

    public ExpenseService(ExpenseRepository repo)
    {
        _repo = repo;
    }
}
