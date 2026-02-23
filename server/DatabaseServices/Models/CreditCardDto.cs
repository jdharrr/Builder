namespace DatabaseServices.Models;

public class CreditCardDto
{
    public required int Id { get; set; }
    
    public string? Company { get; set; }

    public decimal RunningBalance { get; set; } = 0;
    
    public decimal CashBackBalance { get; set; }
    
    
    // For reward rules mapping
    public bool AllOtherCategories { get; set; }

    public int? CategoryId { get; set; }

    public decimal CashBackPercent { get; set; } = 0;
}
