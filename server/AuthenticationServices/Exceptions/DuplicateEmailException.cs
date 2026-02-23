namespace AuthenticationServices.Exceptions;

public class DuplicateEmailException : Exception
{
    public DuplicateEmailException() : base("Email already in use.") { }

    public DuplicateEmailException(string message) : base(message) { }
}