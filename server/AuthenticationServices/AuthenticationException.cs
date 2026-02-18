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

public class DuplicateEmailException : Exception
{
    public DuplicateEmailException() : base("Email already in use.") { }

    public DuplicateEmailException(string message) : base(message) { }
}

public class DuplicateUsernameException : Exception
{
    public DuplicateUsernameException() : base("Username already in use.") { }

    public DuplicateUsernameException(string message) : base(message) { }
}
