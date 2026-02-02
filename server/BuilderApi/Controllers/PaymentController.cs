using BuilderRepositories.Requests;
using BuilderServices.CreditCardService;
using BuilderServices.CreditCardService.Requests;
using BuilderServices.CreditCardService.Responses;
using BuilderServices.ExpensePayments.ExpensePaymentService;
using BuilderServices.ExpensePayments.ExpensePaymentService.Requests;
using BuilderServices.ExpensePayments.ExpensePaymentService.Responses;
using BuilderServices.ExpensePayments.ExpensePaymentTableService;
using BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;
using BuilderServices.ExpensePayments.ExpensePaymentTableService.Requests;
using BuilderServices.ExpensePayments.ExpensePaymentTableService.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentController(
    ExpensePaymentService paymentService,
    ExpensePaymentTableService paymentTableService,
    CreditCardService creditCardService
) : ControllerBase
{
    private readonly List<string> _sortDirs = ["asc", "desc"];

    [HttpGet("total")]
    public async Task<IActionResult> GetTotalSpent()
    {
        var totalSpent = await paymentService.GetTotalSpentAsync().ConfigureAwait(false);
        
        return Ok(new PaymentTotalSpentResponse
        {
            TotalSpent = totalSpent
        });
    }
    
    [HttpDelete("unpay/dueDates")]
    public async Task<IActionResult> UnpayDueDates([FromBody] UnpayDueDatesRequest request)
    {
        await paymentService.UnpayDueDateAsync(request.PaymentIds, request.ExpenseId).ConfigureAwait(false);

        return Ok(new UnpayDueDatesResponse
        {
            IsUnpaid = true
        });
    }
    
    [HttpPost("pay/overdue/{expenseId:int}")]
    public async Task<IActionResult> PayAllOverdueDates(int expenseId)
    {
        await paymentService.PayAllOverdueDatesAsync(expenseId).ConfigureAwait(false);

        return Ok(new PayAllOverdueDatesResponse
        {
            IsPaid = true
        });
    }
    
    [HttpPatch("pay/dueDates")]
    public async Task<IActionResult> PayDueDates([FromBody] PayDueDatesRequest request)
    {
        foreach (var dueDate in request.DueDates)
            await paymentService.PayDueDateAsync(request.ExpenseId, dueDate, request.IsSkipped, request.CreditCardId, request.DatePaid).ConfigureAwait(false);
        
        return Ok(new PayDueDatesResponse
        {
            IsPaid = true
        });
    }
    
    [HttpGet("expense/{id:int}")]
    public async Task<IActionResult> GetPaymentsForExpense(int id)
    {
        var payments = await paymentService.GetPaymentsForExpenseAsync(id).ConfigureAwait(false);
        
        return Ok(payments);
    }

    [HttpGet("monthlyTotals")]
    public async Task<IActionResult> GetMonthTotalsByYear([FromQuery] MonthlyTotalsRequest request)
    {
        var totals = await paymentService.GetMonthlyTotalsByYearAsync(request.Year, request.CategoryId).ConfigureAwait(false);

        return Ok(totals);
    }

    [HttpPost("pay/scheduled")]
    public async Task<IActionResult> PayScheduledDueDates()
    {
        await paymentService.PayScheduledDueDatesAsync().ConfigureAwait(false);

        return Ok(new PayScheduledDueDatesResponse
        {
            IsPaid = true
        });
    }

    [HttpPost("creditCards/create")]
    public async Task<IActionResult> CreateCreditCard([FromBody] CreateCreditCardRequest request)
    {
        await creditCardService.CreateCreditCardAsync(request.CreditCardCompany).ConfigureAwait(false);

        return Ok(new CreateCreditCardResponse
        {
            IsCreated = true
        });
    }

    [HttpGet("creditCards")]
    public async Task<IActionResult> GetCreditCardsInfo()
    {
        var creditCards = await creditCardService.GetCreditCardsInfoAsync().ConfigureAwait(false);

        return Ok(creditCards);
    }

    [HttpPatch("creditCards/{id:int}/update/company")]
    public async Task<IActionResult> UpdateCreditCardCompany([FromBody] UpdateCreditCardCompanyRequest request, int id)
    {
        await creditCardService.UpdateCreditCardCompanyAsync(request.NewCompanyName, id).ConfigureAwait(false);

        return Ok(new UpdateCreditCardCompanyResponse
        {
            IsUpdated = true
        });
    }

    [HttpPost("creditCards/{id:int}/pay")]
    public async Task<IActionResult> PayCreditCardBalanceAsync([FromBody] PayCreditCardBalanceRequest request, int id)
    {
        if (request.PaymentAmount < 0)
            return BadRequest("Payment amount must not be negative");
        
        await creditCardService.PayCreditCardBalanceAsync(id, request.PaymentAmount, request.PaymentDate)
            .ConfigureAwait(false);

        return Ok(new PayCreditCardBalanceResponse
        {
            IsPaid = true
        });
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllPaymentsForTable([FromQuery] GetTablePaymentsRequest request)
    {
        if (string.IsNullOrEmpty(request.Sort) || string.IsNullOrEmpty(request.SortDir))
            return BadRequest("Must provide sort column and sort direction.");
        
        if (!Enum.TryParse(typeof(PaymentSortOption), request.Sort, true, out var sortOption))
            return BadRequest("Invalid sort option.");
        
        if (!_sortDirs.Contains(request.SortDir))
            return BadRequest("Invalid sort direction.");
        
        object? searchColumn = null;
        if (!string.IsNullOrEmpty(request.SearchColumn) && !Enum.TryParse(typeof(PaymentSearchColumn), request.SearchColumn, true, out searchColumn))
            return BadRequest("Invalid search column.");

        List<TableFilter> filters = [];
        if (request.Filters.Count > 0)
        {
            foreach (var filter in request.Filters)
            {
                if (!Enum.TryParse(typeof(PaymentTableFilterOption), filter.Filter, true, out var filterEnum))
                    return BadRequest("Invalid filter.");
                
                filters.Add(new TableFilter
                {
                    FilterType = ((PaymentTableFilterOption)filterEnum).GetFilterType(),
                    FilterColumn = ((PaymentTableFilterOption)filterEnum).GetFilterColumn(),
                    Value1 = filter.Value1,
                    Value2 = filter.Value2
                });
            }
        }
        
        var payments = await paymentTableService.GetAllPaymentsForTableAsync(((PaymentSortOption)sortOption!).GetColumnName(), request.SortDir, ((PaymentSearchColumn?)searchColumn)?.GetColumnName(), request.SearchValue, request.ShowSkipped, filters).ConfigureAwait(false);


        return Ok(payments);
    }
    
    [HttpGet("table/options/searchableColumns")]
    public IActionResult GetSearchableColumns()
    {
        var columns = ExpensePaymentTableService.GetSearchColumns();

        return Ok(new PaymentTableSearchableColumnsResponse
        {
            SearchableColumns = columns
        });
    }
    
    [HttpGet("table/options/sort")]
    public IActionResult GetSortOptions()
    {
        var options = ExpensePaymentTableService.GetSortOptions();

        return Ok(new PaymentTableSortOptionsResponse
        {
            SortOptions = options
        });
    }
    
    [HttpGet("table/options/filters")]
    public IActionResult GetExpenseTableFilterOptions()
    {
        var filters = ExpensePaymentTableService.GetFilterOptions();

        return Ok(new PaymentTableFilterOptionsResponse
        {
            FilterOptions = filters
        });
    }
}
