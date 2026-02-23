namespace DatabaseServices.Models;

public class CreditCardRewardsRuleDto
{
    public int CreditCardId { get; set; }
    
    public bool AllOtherCategories { get; set; }
    
    public int? CategoryId { get; set; }
    
    public decimal CashBackPercent { get; set; }
}