using BuilderRepositories.UserRepository;

namespace BuilderServices;

public class UserService
{
    private readonly UserRepository _repo;

    public UserService(UserRepository repo)
    {
        _repo = repo;
    }
}
