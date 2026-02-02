using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.CreditCardService.Responses;

namespace BuilderServices.CreditCardService;

public class CreditCardService(
    CreditCardRepository creditCardRepo,
    CreditCardPaymentsRepository creditCardPaymentsRepo,
    UserContext userContext
)
{
    public async Task CreateCreditCardAsync(string creditCardCompany)
    {
        await creditCardRepo.CreateCreditCardAsync(creditCardCompany, userContext.UserId).ConfigureAwait(false);
    }

    public async Task<GetCreditCardsInfoResponse> GetCreditCardsInfoAsync()
    {
        var creditCards = await creditCardRepo.GetCreditCardsInfoAsync(userContext.UserId).ConfigureAwait(false);

        return new GetCreditCardsInfoResponse
        {
            CreditCards = creditCards.Select(card => new GetCreditCardsInfoItemResponse
            {
                Id = card.Id,
                Company = card.Company ?? string.Empty,
                RunningBalance = card.RunningBalance
            }).ToList()
        };
    }

    public async Task UpdateCreditCardCompanyAsync(string newCompanyName, int creditCardId)
    {
        await creditCardRepo.UpdateCreditCardCompanyAsync(newCompanyName, creditCardId, userContext.UserId)
            .ConfigureAwait(false);
    }

    public async Task PayCreditCardBalanceAsync(int creditCardId, decimal paymentAmount, string paymentDate)
    {
        await creditCardPaymentsRepo.CreateCreditCardPaymentAsync(creditCardId, paymentAmount, paymentDate)
            .ConfigureAwait(false);

        await creditCardRepo.PayCreditCardBalanceAsync(creditCardId, paymentAmount, userContext.UserId).ConfigureAwait(false);
    }
}
