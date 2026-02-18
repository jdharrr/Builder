using BuilderServices.Requests;
using FluentValidation;

namespace BuilderApi.Controllers.Validators;

public class IdRequestValidator : AbstractValidator<IdRequest>
{
    public IdRequestValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0);
    }
}
