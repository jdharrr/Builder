using BuilderRepositories;
using FluentValidation;
using FluentValidation.Results;

namespace BuilderServices;

public class ValidatorService(
    IServiceProvider serviceProvider   
)
{
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
}