using BuilderRepositories;
using FluentValidation;
using FluentValidation.Results;
using System.Text.RegularExpressions;

namespace BuilderServices;

public class ValidatorService(
    IServiceProvider serviceProvider   
)
{
    private static readonly Regex IsoDateRegex = new(@"^\d{4}-\d{2}-\d{2}$", RegexOptions.Compiled);

    private IValidator<T> GetValidator<T>()
    {
        var genericType = typeof(IValidator<>).MakeGenericType(typeof(T));
        var validatorObject = serviceProvider.GetService(genericType)
            ?? throw new GenericException("Could not get model validator");

        return (IValidator<T>)validatorObject;
    }

    public async Task<ValidationResult> ValidateAsync<T>(T model)
    {
        var validator = GetValidator<T>();

        return await validator.ValidateAsync(model);
    }

    public static bool IsIsoDate(string? value)
    {
        return !string.IsNullOrWhiteSpace(value) && IsoDateRegex.IsMatch(value);
    }
}
