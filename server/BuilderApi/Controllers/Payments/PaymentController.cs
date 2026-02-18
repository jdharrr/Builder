using BuilderRepositories.Requests;
using BuilderServices.CreditCardService;
using BuilderServices.CreditCardService.Requests;
using BuilderServices.CreditCardService.Responses;
using BuilderServices.ExpensePayments.ExpensePaymentChartService;
using BuilderServices.ExpensePayments.ExpensePaymentChartService.Requests;
using BuilderServices.ExpensePayments.ExpensePaymentService;
using BuilderServices.ExpensePayments.ExpensePaymentService.Requests;
using BuilderServices.ExpensePayments.ExpensePaymentService.Responses;
using BuilderServices.ExpensePayments.ExpensePaymentTableService;
using BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;
using BuilderServices.ExpensePayments.ExpensePaymentTableService.Requests;
using BuilderServices.ExpensePayments.ExpensePaymentTableService.Responses;
using BuilderServices;
using BuilderServices.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers.Payments;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentController(
    ExpensePaymentService paymentService,
    ExpensePaymentChartService paymentChartService,
    ExpensePaymentTableService paymentTableService,
    CreditCardService creditCardService,
    ValidatorService validatorService
) : ControllerBase
{
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
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        await paymentService.DeletePaymentsAsync(request.PaymentIds, request.ExpenseId, request.RemoveFromCreditCard ?? false).ConfigureAwait(false);

        return Ok(new UnpayDueDatesResponse
        {
            IsUnpaid = true
        });
    }
    
    [HttpPost("pay/overdue/{id:int}")]
    public async Task<IActionResult> PayAllOverdueDates([FromRoute] IdRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        await paymentService.PayAllOverdueDatesAsync(request.Id).ConfigureAwait(false);

        return Ok(new PayAllOverdueDatesResponse
        {
            IsPaid = true
        });
    }
    
    [HttpPatch("pay/dueDates")]
    public async Task<IActionResult> PayDueDates([FromBody] PayDueDatesRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        foreach (var dueDate in request.DueDates)
            await paymentService.PayDueDateAsync(request.ExpenseId, dueDate, request.IsSkipped, request.CreditCardId, request.DatePaid).ConfigureAwait(false);
        
        return Ok(new PayDueDatesResponse
        {
            IsPaid = true
        });
    }
    
    [HttpGet("expense/{id:int}")]
    public async Task<IActionResult> GetPaymentsForExpense([FromRoute] IdRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        var payments = await paymentService.GetPaymentsForExpenseAsync(request.Id).ConfigureAwait(false);
        
        return Ok(payments);
    }

    [HttpGet("monthlyTotals")]
    public async Task<IActionResult> GetMonthTotalsByYear([FromQuery] MonthlyTotalsRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        var totals = await paymentChartService.GetMonthlyTotalsByYearAsync(request.Year, request.CategoryId).ConfigureAwait(false);

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
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

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
    public async Task<IActionResult> UpdateCreditCardCompany([FromRoute] IdRequest routeRequest, [FromBody] UpdateCreditCardCompanyRequest request)
    {
        var routeValidation = await validatorService.ValidateAsync(routeRequest);
        if (!routeValidation.IsValid)
            return BadRequest(routeValidation.Errors);

        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        await creditCardService.UpdateCreditCardCompanyAsync(request.NewCompanyName, routeRequest.Id).ConfigureAwait(false);

        return Ok(new UpdateCreditCardCompanyResponse
        {
            IsUpdated = true
        });
    }

    [HttpPost("creditCards/{id:int}/pay")]
    public async Task<IActionResult> PayCreditCardBalanceAsync([FromRoute] IdRequest routeRequest, [FromBody] PayCreditCardBalanceRequest request)
    {
        var routeValidation = await validatorService.ValidateAsync(routeRequest);
        if (!routeValidation.IsValid)
            return BadRequest(routeValidation.Errors);

        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);
        
        await creditCardService.PayCreditCardBalanceAsync(routeRequest.Id, request.PaymentAmount, request.PaymentDate, request.CashBackAmount)
            .ConfigureAwait(false);

        return Ok(new PayCreditCardBalanceResponse
        {
            IsPaid = true
        });
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllPaymentsForTable([FromQuery] GetTablePaymentsRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        var filters = ExpensePaymentTableService.BuildTableFilters(request.Filters);
        var payments = await paymentTableService.GetAllPaymentsForTableAsync(request.Sort.GetColumnName(), request.SortDir, request.SearchColumn?.GetColumnName(), request.SearchValue, request.ShowSkipped, filters).ConfigureAwait(false);

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
