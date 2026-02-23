namespace AuthenticationServices.Exceptions;

public class InvalidCredentialsException : Exception
{
    public InvalidCredentialsException() : base("Invalid User Credentials.") { }

    public InvalidCredentialsException(string message) : base(message) { }
}