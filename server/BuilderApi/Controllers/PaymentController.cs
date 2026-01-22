using BuilderServices.ExpensePaymentService;
using BuilderServices.ExpensePaymentService.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly ExpensePaymentService _paymentService;

    public PaymentController(ExpensePaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet("totalSpent")]
    public async Task<IActionResult> GetTotalSpent()
    {
        var totalSpent = await _paymentService.GetTotalSpentAsync().ConfigureAwait(false);
        
        return Ok(totalSpent);
    }
    
    [HttpDelete("unpayDueDates")]
    public async Task<IActionResult> UnpayDueDate([FromBody] UnpayDueDatesRequest request)
    {
        await _paymentService.UnpayDueDateAsync(request.PaymentIds).ConfigureAwait(false);

        return Ok();
    }
    
    [HttpPost("payAllOverdue/{expenseId:int}")]
    public async Task<IActionResult> PayAllOverdueDates(int expenseId)
    {
        await _paymentService.PayAllOverdueDatesAsync(expenseId).ConfigureAwait(false);

        return Ok();
    }
    
    [HttpPatch("payDueDates")]
    public async Task<IActionResult> PayDueDate([FromBody] PayDueDatesRequest request)
    {
        foreach (var dueDate in request.DueDates)
            await _paymentService.PayDueDateAsync(request.ExpenseId, dueDate, request.IsSkipped, null, request.DatePaid).ConfigureAwait(false);
        
        return Ok();
    }
    
    [HttpGet("paymentsForExpense")]
    public async Task<IActionResult> GetPaymentsForExpense([FromQuery] int expenseId)
    {
        var payments = await _paymentService.GetPaymentsForExpenseAsync(expenseId).ConfigureAwait(false);
        
        return Ok(payments);
    }

    [HttpPost("pay/scheduled")]
    public async Task<IActionResult> PayScheduledDueDates()
    {
        await _paymentService.PayScheduledDueDatesAsync().ConfigureAwait(false);

        return Ok();
    }

    [HttpPost("creditCards/create")]
    public async Task<IActionResult> CreateCreditCard([FromBody] string creditCardCompany)
    {
        await _paymentService.CreateCreditCardAsync(creditCardCompany).ConfigureAwait(false);

        return Ok();
    }

    [HttpGet("creditCards")]
    public async Task<IActionResult> GetCreditCardsInfo()
    {
        var creditCards = await _paymentService.GetCreditCardsInfoAsync().ConfigureAwait(false);

        return Ok(creditCards);
    }

    [HttpPatch("creditCards/{id:int}/update/company")]
    public async Task<IActionResult> UpdateCreditCardCompany(UpdateCreditCardCompanyRequest request, int id)
    {
        await _paymentService.UpdateCreditCardCompanyAsync(request.NewCompanyName, id).ConfigureAwait(false);

        return Ok();
    }
}
