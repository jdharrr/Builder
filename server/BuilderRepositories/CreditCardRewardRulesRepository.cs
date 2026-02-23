using System.Data;
using DatabaseServices;
using DatabaseServices.Models;

namespace BuilderRepositories;

public class CreditCardRewardRulesRepository : BuilderRepository
{
    private readonly DatabaseService _dbService;
    
    public CreditCardRewardRulesRepository(DatabaseService dbService) : base(dbService)
    {
        _dbService = dbService;
    }
    
    public async Task<bool> CreateCreditCardRewardsRuleAsync(int creditCardId, int? categoryId, bool allOtherCategories, decimal cashBackPercent)
    {
        var sql = @"INSERT INTO credit_card_reward_rules (credit_card_id, category_id, cash_back_percent, all_other_categories)
                  VALUES (@creditCardId, @categoryId, @cashBackPercent, @allOtherCategories)";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardId", creditCardId },
            { "@categoryId", categoryId },
            { "@cashBackPercent", cashBackPercent },
            { "@allOtherCategories", allOtherCategories ? 1 : 0 }
        };

        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).LastInsertedId > 0;
    }

    public async Task<List<CreditCardRewardsRuleDto>> GetRewardRulesByCreditCardIdAsync(int creditCardId)
    {
        var sql = @"SELECT
                        category_id,
                        cash_back_percent,
                        all_other_categories
                    FROM credit_card_reward_rules
                    WHERE credit_card_id = @creditCardId";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardId", creditCardId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row =>
        {
            var allOtherValue = row["all_other_categories"];
            var allOther = allOtherValue != DBNull.Value && (allOtherValue is bool boolValue
                ? boolValue
                : Convert.ToInt32(allOtherValue) == 1);

            return new CreditCardRewardsRuleDto
            {
                CategoryId = row.Field<int?>("category_id"),
                AllOtherCategories = allOther,
                CashBackPercent = row.Field<decimal>("cash_back_percent")
            };
        }) ?? [];
    }

    public async Task<bool> UpdateCreditCardRewardRuleAsync(int creditCardId, int? categoryId, bool allOtherCategories, decimal cashBackPercent)
    {
        if (categoryId is null && !allOtherCategories)
            return false;

        if (categoryId is not null && allOtherCategories)
            return false;
        
        var sql = @"UPDATE credit_card_reward_rules
                    SET cash_back_percent = @cashBackPercent
                    WHERE credit_card_id = @creditCardId";
        var parameters = new Dictionary<string, object?>
        {
            { "@cashBackPercent", cashBackPercent },
            { "@creditCardId", creditCardId }
        };

        if (categoryId is not null)
        {
            sql += " AND category_id = @categoryId";
            parameters["@categoryId"] = categoryId;
        }
        else 
        {
            sql += " AND all_other_categories = 1";
        }
        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).RowsAffected > 0;
    }

    public async Task<bool> DeleteCreditCardRewardRuleAsync(int creditCardId, int? categoryId, bool allOtherCategories)
    {
        if (categoryId is null && !allOtherCategories)
            return false;

        if (categoryId is not null && allOtherCategories)
            return false;

        var sql = @"DELETE FROM credit_card_reward_rules
                    WHERE credit_card_id = @creditCardId";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardId", creditCardId },
        };

        if (categoryId is not null)
        {
            sql += " AND category_id = @categoryId";
            parameters["@categoryId"] = categoryId;
        }
        else
        {
            sql += " AND all_other_categories = 1";
        }

        return (await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false)).RowsAffected > 0;
    }
}
