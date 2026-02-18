using BuilderServices.ExpensePayments.ExpensePaymentService;
using BuilderServices.Expenses.ExpenseService.Requests;
using BuilderServices.Expenses.ExpenseService.Responses;

namespace BuilderServices.Expenses.ExpenseCreationService;

public class ExpenseCreationService(
    ExpenseService.ExpenseService expenseService,
    ExpensePaymentService paymentService
)
{
    public async Task<CreateExpenseResponse> CreateExpenseAsync(CreateExpenseRequest request)
    {
        var expenseId = await expenseService.CreateExpenseAsync(request).ConfigureAwait(false);
        await SetUpPayOnExpenseCreation(request, (int)expenseId).ConfigureAwait(false);
        
        return new CreateExpenseResponse
        {
            IsCreated = true
        };
    }
    
    private async Task SetUpPayOnExpenseCreation(CreateExpenseRequest request, int expenseId)
    {
        var hasOneTimePayment = request.OneTimePayment.IsPaid || request.OneTimePayment.IsCredit;
        if (hasOneTimePayment && !request.AutomaticPayment.Enabled)
            await paymentService
                .PayDueDateAsync(expenseId, request.StartDate, false, request.OneTimePayment.CreditCardId, request.OneTimePayment.PaymentDate)
                .ConfigureAwait(false);
        
        if (request.PayToNowPayment.Enabled)
            await paymentService.PayAllOverdueDatesAsync(expenseId, request.PayToNowPayment.CreditCardId).ConfigureAwait(false);
    }
}