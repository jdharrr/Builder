using BuilderServices.Responses;

namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Responses;

public class PaymentTableFilterOptionsResponse
{
    public TableFilterOptionsResponse FilterOptions { get; set; } = new();
}

