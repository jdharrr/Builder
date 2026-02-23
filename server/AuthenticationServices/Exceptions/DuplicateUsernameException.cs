namespace AuthenticationServices.Exceptions;

public class DuplicateUsernameException : Exception
{
    public DuplicateUsernameException() : base("Username already in use.") { }

    public DuplicateUsernameException(string message) : base(message) { }
}