namespace AuthenticationServices;

public class InvalidTokenException : Exception
{
    public InvalidTokenException() : base("Invalid Token.") { }

    public InvalidTokenException(string message) : base(message) { }
}

public class InvalidCredentialsException : Exception
{
    public InvalidCredentialsException() : base("Invalid User Credentials.") { }

    public InvalidCredentialsException(string message) : base(message) { }
}