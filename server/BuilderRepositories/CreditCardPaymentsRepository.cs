using DatabaseServices;

namespace BuilderRepositories;

public class CreditCardPaymentsRepository : BuilderRepository
{
    private readonly DatabaseService _dbService;

    public CreditCardPaymentsRepository(DatabaseService dbService) : base(dbService)
    {
        _dbService = dbService;
    }

    public async Task CreateCreditCardPaymentAsync(int creditCardId, decimal paymentAmount, string paymentDate, bool usingCashBack = false)
    {
        var sql = @"INSERT INTO credit_card_payments (credit_card_id, payment_amount, payment_date, using_cash_back)
                    VALUES (@creditCardId, @paymentAmount, @paymentDate, @usingCashBack)";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardId", creditCardId },
            { "@paymentAmount", paymentAmount },
            { "@paymentDate", paymentDate },
            { "@usingCashBack", usingCashBack }
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }
}