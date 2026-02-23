namespace BuilderRepositories.Exceptions;

public class GenericException : Exception
{
    public GenericException() : base("An error has occured.") { }

    public GenericException(string message) : base(message) { }
}
