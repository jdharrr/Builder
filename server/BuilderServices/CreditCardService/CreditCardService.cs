using AuthenticationServices;
using BuilderRepositories;
using BuilderRepositories.Exceptions;
using BuilderServices.CreditCardService.Requests;
using BuilderServices.CreditCardService.Responses;
using DatabaseServices.Models;

namespace BuilderServices.CreditCardService;

public class CreditCardService(
    CreditCardRepository creditCardRepo,
    CreditCardPaymentsRepository creditCardPaymentsRepo,
    CreditCardRewardRulesRepository rewardsRepo,
    UserContext userContext
)
{
    #region Public service methods
    
    public async Task CreateCreditCardAsync(string creditCardCompany, List<CreditCardRewardsRuleDto>? cashBackRules = null)
    {
        var creditCardId = await creditCardRepo.CreateCreditCardAsync(creditCardCompany, userContext.UserId).ConfigureAwait(false);
        if (creditCardId <= 0)
            throw new GenericException("Failed to credit credit card");
        
        if (cashBackRules is not null)
        {
            await CreateCreditCardRewardRulesAsync(cashBackRules, (int)creditCardId).ConfigureAwait(false);
        }
    }

    public async Task<GetCreditCardsInfoResponse> GetCreditCardsInfoAsync()
    {
        var creditCards = await creditCardRepo.GetCreditCardsInfoAsync(userContext.UserId).ConfigureAwait(false);

        return MapCreditCardsToResponse(creditCards);
    }

    public async Task UpdateCreditCardAsync(string companyName, List<RewardsRule> rewardsRules, int creditCardId)
    {
        await creditCardRepo.BeginTransactionAsync().ConfigureAwait(false);
        try
        {
            await UpdateCreditCardRewardRulesAsync(rewardsRules, creditCardId)
                .ConfigureAwait(false);
        }
        catch
        {
            await creditCardRepo.RollbackTransactionAsync().ConfigureAwait(false);
            throw new GenericException("Failed to update credit card.");
        }
        
        var didUpdateName = await creditCardRepo.UpdateCreditCardCompanyAsync(companyName, creditCardId, userContext.UserId).ConfigureAwait(false);
        if (!didUpdateName)
        {
            await creditCardRepo.RollbackTransactionAsync().ConfigureAwait(false);
            throw new GenericException("Failed to update credit card.");
        }
        await creditCardRepo.CommitTransactionAsync().ConfigureAwait(false);
    }

    public async Task PayCreditCardBalanceAsync(int creditCardId, decimal paymentAmount, string paymentDate, decimal cashBackAmount)
    {
        if (cashBackAmount <= 0 && paymentAmount <= 0)
            throw new GenericException("Cash back amount and payment amount can not both be 0.");
        
        await creditCardPaymentsRepo.BeginTransactionAsync().ConfigureAwait(false);
        if (paymentAmount > 0)
        {
            var creditCardPaymentId = await creditCardPaymentsRepo.CreateCreditCardPaymentAsync(creditCardId, paymentAmount, paymentDate).ConfigureAwait(false);
            if (creditCardPaymentId <= 0)
            {
                await creditCardPaymentsRepo.RollbackTransactionAsync().ConfigureAwait(false);
                throw new GenericException("Failed to pay credit card balance");
            }
        }

        if (cashBackAmount > 0)
        {
            try
            {
                await UpdateCreditCardCashBackForPaymentAsync(creditCardId, cashBackAmount, paymentDate).ConfigureAwait(false);
            }
            catch (GenericException e)
            {
                await creditCardPaymentsRepo.RollbackTransactionAsync().ConfigureAwait(false);
                if (e.Message.Contains("Invalid cash back amount"))
                    throw new GenericException("Invalid cash back amount");
                
                throw new GenericException("Failed to pay credit card balance");
            }
        }

        var totalPayed = paymentAmount + cashBackAmount;
        var didPayBalance = await creditCardRepo.PayCreditCardBalanceAsync(creditCardId, totalPayed, userContext.UserId).ConfigureAwait(false);
        if (!didPayBalance)
        {
            await creditCardPaymentsRepo.RollbackTransactionAsync().ConfigureAwait(false);
            throw new GenericException("Failed to pay credit card balance");
        }

        await creditCardPaymentsRepo.CommitTransactionAsync().ConfigureAwait(false);
    }

    #endregion
    #region Private Helpers
    
    private async Task CreateCreditCardRewardsRuleAsync(int creditCardId, int? categoryId, bool allOtherCategories, decimal cashBackPercent)
    {
        var isCreated = await rewardsRepo.CreateCreditCardRewardsRuleAsync(creditCardId, categoryId, allOtherCategories, cashBackPercent)
            .ConfigureAwait(false);

        if (!isCreated)
            throw new GenericException("Failed to create rewards rule");
    }

    private async Task CreateCreditCardRewardRulesAsync(List<CreditCardRewardsRuleDto> cashBackRules, int creditCardId)
    {
        await creditCardRepo.BeginTransactionAsync().ConfigureAwait(false);
        foreach (var rule in cashBackRules)
        {
            try
            {
                await CreateCreditCardRewardsRuleAsync(creditCardId, rule.CategoryId, rule.AllOtherCategories, rule.CashBackPercent).ConfigureAwait(false);
            }
            catch (GenericException)
            {
                await creditCardRepo.RollbackTransactionAsync().ConfigureAwait(false);
                throw new GenericException("Failed to create cash back rules");
            }
        }

        await creditCardRepo.CommitTransactionAsync().ConfigureAwait(false);
    }

    private static GetCreditCardsInfoResponse MapCreditCardsToResponse(List<CreditCardDto> creditCards)
    {
        var grouped = creditCards
            .GroupBy(r => r.Id);

        return new GetCreditCardsInfoResponse()
        {
            CreditCards = grouped.Select(g =>
            {
                var first = g.First();

                return new GetCreditCardsInfoItemResponse
                {
                    Id = first.Id,
                    Company = first.Company ?? string.Empty,
                    RunningBalance = first.RunningBalance,
                    CashBackBalance = first.CashBackBalance,
                    RewardRules = g
                        .Where(x => x.CategoryId is not null || x.AllOtherCategories)
                        .Select(x => new RewardsRuleResponse
                        {
                            CategoryId = x.CategoryId,
                            AllOtherCategories = x.AllOtherCategories,
                            CashBackPercent = x.CashBackPercent
                        })
                        .ToList()
                };
            }).ToList()
        };
    }

    private async Task UpdateCreditCardRewardRulesAsync(List<RewardsRule> newRewardRules, int creditCardId)
    {
        var oldRewardRules = await rewardsRepo.GetRewardRulesByCreditCardIdAsync(creditCardId).ConfigureAwait(false);
        await UpdateCreditCardOldRewardRulesAsync(newRewardRules, oldRewardRules, creditCardId).ConfigureAwait(false);
        await UpdateCreditCardNewRewardRulesAsync(newRewardRules, oldRewardRules, creditCardId).ConfigureAwait(false);
    }

    private async Task UpdateCreditCardNewRewardRulesAsync(List<RewardsRule> newRewardRules, List<CreditCardRewardsRuleDto> oldRewardRules, int creditCardId)
    {
        var newRules = newRewardRules
            .Where(rule => !oldRewardRules.Any(existing =>
                (rule.AllOtherCategories && existing.AllOtherCategories)
                || (!rule.AllOtherCategories && rule.CategoryId == existing.CategoryId)
            ))
            .ToList();
        
        foreach (var rule in newRules)
        {
            var didCreate = await rewardsRepo.CreateCreditCardRewardsRuleAsync(creditCardId, rule.CategoryId, rule.AllOtherCategories, rule.CashBackPercent)
                .ConfigureAwait(false);
            if (!didCreate)
                throw new GenericException("Failed to add credit card reward rule.");
        }
    }

    private async Task UpdateCreditCardOldRewardRulesAsync(List<RewardsRule> newRewardRules, List<CreditCardRewardsRuleDto> oldRewardRules, int creditCardId)
    {
        foreach (var existingRule in oldRewardRules)
        {
            var matchingRule = existingRule.AllOtherCategories
                ? newRewardRules.FirstOrDefault(x => x.AllOtherCategories)
                : newRewardRules.FirstOrDefault(x => x.CategoryId == existingRule.CategoryId);

            if (matchingRule is not null)
            {
                if (matchingRule.CashBackPercent != existingRule.CashBackPercent)
                {
                    var didUpdateRule = await rewardsRepo.UpdateCreditCardRewardRuleAsync(
                        creditCardId,
                        matchingRule.CategoryId,
                        matchingRule.AllOtherCategories,
                        matchingRule.CashBackPercent
                    ).ConfigureAwait(false);
                    if (!didUpdateRule)
                        throw new GenericException("Failed to update credit card reward rule");
                }

                continue;
            }

            var didDelete = await rewardsRepo.DeleteCreditCardRewardRuleAsync(
                creditCardId,
                existingRule.CategoryId,
                existingRule.AllOtherCategories
            ).ConfigureAwait(false);
            if (!didDelete)
                throw new GenericException("Failed to delete credit card reward rule");
        }
    }

    private async Task UpdateCreditCardCashBackForPaymentAsync(int creditCardId, decimal cashBackAmount, string paymentDate)
    {
        var creditCardPaymentId = await creditCardPaymentsRepo.CreateCreditCardPaymentAsync(creditCardId, cashBackAmount, paymentDate, true).ConfigureAwait(false);
        if (creditCardPaymentId <= 0)
            throw new GenericException("Failed to pay credit card balance");

        var creditCard = await creditCardRepo.GetCreditCardByIdAsync(creditCardId, userContext.UserId).ConfigureAwait(false);
        if (creditCard?.CashBackBalance < cashBackAmount)
            throw new GenericException("Invalid cash back amount");
            
        var didRemoveCashBack = await creditCardRepo.RemoveFromCashBackBalanceAsync(creditCardId, cashBackAmount).ConfigureAwait(false);
        if (!didRemoveCashBack)
            throw new GenericException("Failed to pay credit card balance");
    }
    
    #endregion
}
