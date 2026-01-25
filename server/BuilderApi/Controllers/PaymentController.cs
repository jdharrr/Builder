using BuilderServices.CreditCardService;
using BuilderServices.CreditCardService.Requests;
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
    private readonly CreditCardService _creditCardService;

    public PaymentController(ExpensePaymentService paymentService, CreditCardService creditCardService)
    {
        _paymentService = paymentService;
        _creditCardService = creditCardService;
    }

    [HttpGet("total")]
    public async Task<IActionResult> GetTotalSpent()
    {
        var totalSpent = await _paymentService.GetTotalSpentAsync().ConfigureAwait(false);
        
        return Ok(totalSpent);
    }
    
    [HttpDelete("unpay/dueDates")]
    public async Task<IActionResult> UnpayDueDates([FromBody] UnpayDueDatesRequest request)
    {
        await _paymentService.UnpayDueDateAsync(request.PaymentIds).ConfigureAwait(false);

        return Ok();
    }
    
    [HttpPost("pay/overdue/{expenseId:int}")]
    public async Task<IActionResult> PayAllOverdueDates(int expenseId)
    {
        await _paymentService.PayAllOverdueDatesAsync(expenseId).ConfigureAwait(false);

        return Ok();
    }
    
    [HttpPatch("pay/dueDates")]
    public async Task<IActionResult> PayDueDates([FromBody] PayDueDatesRequest request)
    {
        foreach (var dueDate in request.DueDates)
            await _paymentService.PayDueDateAsync(request.ExpenseId, dueDate, request.IsSkipped, request.CreditCardId, request.DatePaid).ConfigureAwait(false);
        
        return Ok();
    }
    
    [HttpGet("expense/{id:int}")]
    public async Task<IActionResult> GetPaymentsForExpense(int id)
    {
        var payments = await _paymentService.GetPaymentsForExpenseAsync(id).ConfigureAwait(false);
        
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
        await _creditCardService.CreateCreditCardAsync(creditCardCompany).ConfigureAwait(false);

        return Ok();
    }

    [HttpGet("creditCards")]
    public async Task<IActionResult> GetCreditCardsInfo()
    {
        var creditCards = await _creditCardService.GetCreditCardsInfoAsync().ConfigureAwait(false);

        return Ok(creditCards);
    }

    [HttpPatch("creditCards/{id:int}/update/company")]
    public async Task<IActionResult> UpdateCreditCardCompany(UpdateCreditCardCompanyRequest request, int id)
    {
        await _creditCardService.UpdateCreditCardCompanyAsync(request.NewCompanyName, id).ConfigureAwait(false);

        return Ok();
    }

    [HttpPost("creditCards/{id:int}/pay")]
    public async Task<IActionResult> PayCreditCardBalanceAsync(PayCreditCardBalanceRequest request, int id)
    {
        if (request.PaymentAmount < 0)
            return BadRequest("Payment amount must not be negative");
        
        await _creditCardService.PayCreditCardBalanceAsync(id, request.PaymentAmount, request.PaymentDate)
            .ConfigureAwait(false);

        return Ok();
    }
}
