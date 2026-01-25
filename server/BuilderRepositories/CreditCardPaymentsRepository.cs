using DatabaseServices;

namespace BuilderRepositories;

public class CreditCardPaymentsRepository : BuilderRepository
{
    private readonly DatabaseService _dbService;

    public CreditCardPaymentsRepository(DatabaseService dbService) : base(dbService)
    {
        _dbService = dbService;
    }

    public async Task CreateCreditCardPaymentAsync(int creditCardId, decimal paymentAmount, string paymentDate)
    {
        var sql = @"INSERT INTO credit_card_payments (credit_card_id, payment_amount, payment_date)
                    VALUES (@creditCardId, @paymentAmount, @paymentDate)";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardId", creditCardId },
            { "@paymentAmount", paymentAmount },
            { "@paymentDate", paymentDate }
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }
}