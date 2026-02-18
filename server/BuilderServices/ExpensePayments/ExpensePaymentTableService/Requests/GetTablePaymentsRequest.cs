using BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;
using BuilderServices.Requests;

namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Requests;

public class GetTablePaymentsRequest
{
    public PaymentSortOption Sort { get; set; } = PaymentSortOption.PaymentDate;

    public string SortDir { get; set; } = "desc";

    public PaymentSearchColumn? SearchColumn { get; set; }

    public string? SearchValue { get; set; }

    public bool ShowSkipped { get; set; } = false;

    public List<FilterRequest> Filters { get; set; } = [];
}