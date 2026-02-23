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

    public async Task<long> CreateCreditCardAsync(string creditCardCompany, int userId)
    {
        var sql = @"INSERT INTO credit_cards (credit_company, user_id)
                    VALUES (@creditCardCompany, @userId)";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardCompany", creditCardCompany },
            { "@userId", userId }
        };

        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).LastInsertedId;
    }

    public async Task<List<CreditCardDto>> GetCreditCardsInfoAsync(int userId)
    {
        var sql = @"SELECT 
                        cc.id,
                        cc.credit_company,
                        cc.running_balance,
                        cc.cash_back_balance,
                        ccrr.cash_back_percent,
                        ccrr.category_id,
                        ccrr.all_other_categories
                    FROM credit_cards cc
                    LEFT JOIN credit_card_reward_rules ccrr
                        ON cc.id = ccrr.credit_card_id
                    WHERE user_id = @userId
                    GROUP BY
                        cc.id,
                        ccrr.cash_back_percent, 
                        cc.credit_company,
                        cc.running_balance, 
                        cc.cash_back_balance, 
                        cc.id, 
                        ccrr.category_id,
                        ccrr.all_other_categories";
        var parameters = new Dictionary<string, object?>
        {
            { "@userId", userId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row =>
        {
            var allOtherValue = row["all_other_categories"];
            var allOther = allOtherValue != DBNull.Value && (allOtherValue is bool boolValue
                ? boolValue
                : Convert.ToInt32(allOtherValue) == 1);

            return new CreditCardDto
            {
                Id = row.Field<int>("id"),
                Company = row.Field<string>("credit_company"),
                RunningBalance = row.Field<decimal>("running_balance"),
                CashBackBalance = row.Field<decimal>("cash_back_balance"),
                AllOtherCategories = allOther,
                CategoryId = row.Field<int?>("category_id"),
                CashBackPercent = row.Field<decimal?>("cash_back_percent") ?? 0
            };
        }) ?? [];
    }

    public async Task<bool> UpdateCreditCardCompanyAsync(string newCompanyName, int creditCardId, int userId)
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

        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).RowsAffected > 0;
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

        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).RowsAffected;
    }

    public async Task<bool> PayCreditCardBalanceAsync(int creditCardId, decimal paymentAmount, int userId)
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

        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).RowsAffected > 0;
    }

    public async Task<long> RemovePaymentFromCreditCard(int creditCardId, decimal cost, int userId)
    {
        var sql = @"UPDATE credit_cards
                    SET running_balance = running_balance - @cost
                    WHERE id = @creditCardId
                        AND user_id = @userId";
        var parameters = new Dictionary<string, object?>
        {
            { "@cost", cost },
            { "@creditCardId", creditCardId },
            { "@userId", userId }
        };

        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).RowsAffected;
    }

    public async Task<CreditCardDto?> GetCreditCardByIdAsync(int creditCardId, int userId)
    {
        var sql = @"SELECT 
                        id,
                        credit_company,
                        running_balance,
                        cash_back_balance
                    FROM credit_cards cc
                    WHERE user_id = @userId
                        AND id = @creditCardId";
        var parameters = new Dictionary<string, object?>
        {
            { "@userId", userId },
            { "@creditCardId", creditCardId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapSingle(row => new CreditCardDto
        {
            Id = row.Field<int>("id"),
            Company = row.Field<string>("credit_company"),
            RunningBalance = row.Field<decimal>("running_balance"),
            CashBackBalance = row.Field<decimal>("cash_back_balance")
        });
    }

    public async Task<bool> RemoveFromCashBackBalanceAsync(int creditCardId, decimal amount)
    {
        var sql = @"UPDATE credit_cards
                  SET cash_back_balance = cash_back_balance - @amount
                  WHERE id = @creditCardId";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardId", creditCardId },
            { "@amount", amount }
        };
        
        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).RowsAffected > 0;
    }
    
    public async Task<bool> AddToCashBackBalanceAsync(int creditCardId, decimal amount)
    {
        var sql = @"UPDATE credit_cards
                  SET cash_back_balance = cash_back_balance + @amount
                  WHERE id = @creditCardId";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardId", creditCardId },
            { "@amount", amount }
        };
        
        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).RowsAffected > 0;
    }
}
