namespace BuilderServices.CreditCardService.Requests;

public class UpdateCreditCardRequest
{
    public required string NewCompanyName { get; set; }

    public List<RewardsRule> RewardsRules { get; set; } = [];
}
