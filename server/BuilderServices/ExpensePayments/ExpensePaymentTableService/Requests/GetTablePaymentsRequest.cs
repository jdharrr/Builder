using BuilderServices.Requests;

namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Requests;

public class GetTablePaymentsRequest
{
    public string Sort { get; set; } = "PaymentDate";

    public string SortDir { get; set; } = "desc";

    public string? SearchColumn { get; set; }

    public string? SearchValue { get; set; }

    public bool ShowSkipped { get; set; } = false;

    public List<FilterRequest> Filters { get; set; } = [];
}