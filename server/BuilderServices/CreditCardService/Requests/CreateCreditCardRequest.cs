namespace BuilderServices.CreditCardService.Requests;

public class CreateCreditCardRequest
{
    public required string CreditCardCompany { get; set; }

    public List<RewardsRule> RewardsRules { get; set; } = [];
}

public class RewardsRule
{
    public bool AllOtherCategories { get; set; }
    
    public int? CategoryId { get; set; }
    
    public required decimal CashBackPercent { get; set; }
}
