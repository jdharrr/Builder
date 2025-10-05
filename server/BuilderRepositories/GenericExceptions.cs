namespace BuilderRepositories;

public class UserNotFoundException : Exception
{
    public UserNotFoundException() : base("User not found.") { }

    public UserNotFoundException(string message) : base(message) { }
}

public class GenericException : Exception
{
    public GenericException() : base("An error has occured.") { }

    public GenericException(string message) : base(message) { }
}
