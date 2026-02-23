namespace BuilderServices.CreditCardService.Responses;

public class GetCreditCardsInfoResponse
{
    public List<GetCreditCardsInfoItemResponse> CreditCards { get; set; } = [];
}

public class GetCreditCardsInfoItemResponse
{
    public int Id { get; set; }

    public string Company { get; set; } = string.Empty;

    public decimal RunningBalance { get; set; }
    
    public decimal CashBackBalance { get; set; }

    public List<RewardsRuleResponse> RewardRules { get; set; } = [];
}

public class RewardsRuleResponse
{
    public int? CategoryId { get; set; }

    public bool AllOtherCategories { get; set; }
    
    public decimal CashBackPercent { get; set; }
}
