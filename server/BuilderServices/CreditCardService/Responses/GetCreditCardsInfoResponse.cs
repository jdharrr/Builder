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
}
