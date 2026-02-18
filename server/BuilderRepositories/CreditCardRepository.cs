using System.Data;
using DatabaseServices;
using DatabaseServices.Models;

namespace BuilderRepositories;

public class CreditCardRepository : BuilderRepository
{
    private readonly DatabaseService _dbService;
    
    public CreditCardRepository(DatabaseService dbService) : base(dbService)
    {
        _dbService = dbService;
    }

    public async Task CreateCreditCardAsync(string creditCardCompany, int userId)
    {
        var sql = @"INSERT INTO credit_cards (credit_company, user_id)
                    VALUES (@creditCardCompany, @userId)";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardCompany", creditCardCompany },
            { "@userId", userId }
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }

    public async Task<List<CreditCardDto>> GetCreditCardsInfoAsync(int userId)
    {
        var sql = @"SELECT 
                        *
                    FROM credit_cards
                    WHERE user_id = @userId";
        var parameters = new Dictionary<string, object?>
        {
            { "@userId", userId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new CreditCardDto
        {
            Id = row.Field<int>("id"),
            Company = row.Field<string>("credit_company"),
            RunningBalance = row.Field<decimal>("running_balance")
        }) ?? [];
    }

    public async Task UpdateCreditCardCompanyAsync(string newCompanyName, int creditCardId, int userId)
    {
        var sql = @"UPDATE credit_cards
                    SET credit_company = @newCompanyName
                    WHERE id = @creditCardId
                        AND user_id = @userId";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardId", creditCardId },
            { "@userId", userId },
            { "@newCompanyName", newCompanyName}
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }

    public async Task<long> AddPaymentToCreditCardAsync(decimal cost, int creditCardId, int userId)
    {
        var sql = @"UPDATE credit_cards
                    SET running_balance = running_balance + @cost
                    WHERE id = @creditCardId
                        AND user_id = @userId";
        var parameters = new Dictionary<string, object?>
        {
            { "@cost", cost },
            { "@creditCardId", creditCardId },
            { "@userId", userId }
        };

        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).LastInsertedId;
    }

    public async Task PayCreditCardBalanceAsync(int creditCardId, decimal paymentAmount, int userId)
    {
        var sql = @"UPDATE credit_cards
                    SET running_balance = running_balance - @paymentAmount
                    WHERE id = @creditCardId
                        AND user_id = @userId";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardId", creditCardId },
            { "@paymentAmount", paymentAmount },
            { "@userId", userId }
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }
}