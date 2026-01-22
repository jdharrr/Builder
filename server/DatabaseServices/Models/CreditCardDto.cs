namespace DatabaseServices.Models;

public class CreditCardDto
{
    public required int Id { get; set; }
    
    public string? Company { get; set; }

    public decimal RunningBalance { get; set; } = 0;
}