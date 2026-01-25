using AuthenticationServices;
using BuilderRepositories;
using DatabaseServices.Models;

namespace BuilderServices.CreditCardService;

public class CreditCardService
{
    private readonly CreditCardRepository _creditCardRepo;

    private readonly CreditCardPaymentsRepository _creditCardPaymentsRepo;
    
    private readonly UserContext _userContext;

    public CreditCardService(CreditCardRepository creditCardRepo, CreditCardPaymentsRepository creditCardPaymentsRepo, UserContext userContext)
    {
        _creditCardRepo = creditCardRepo;
        _creditCardPaymentsRepo = creditCardPaymentsRepo;
        _userContext = userContext;
    }

    public async Task CreateCreditCardAsync(string creditCardCompany)
    {
        await _creditCardRepo.CreateCreditCardAsync(creditCardCompany, _userContext.UserId).ConfigureAwait(false);
    }

    public async Task<List<CreditCardDto>> GetCreditCardsInfoAsync()
    {
        return await _creditCardRepo.GetCreditCardsInfoAsync(_userContext.UserId).ConfigureAwait(false);
    }

    public async Task UpdateCreditCardCompanyAsync(string newCompanyName, int creditCardId)
    {
        await _creditCardRepo.UpdateCreditCardCompanyAsync(newCompanyName, creditCardId, _userContext.UserId)
            .ConfigureAwait(false);
    }

    public async Task AddPaymentToCreditCardAsync(decimal cost, int creditCardId)
    {
        await _creditCardRepo.AddPaymentToCreditCardAsync(cost, creditCardId, _userContext.UserId).ConfigureAwait(false);
    }

    public async Task PayCreditCardBalanceAsync(int creditCardId, decimal paymentAmount, string paymentDate)
    {
        await _creditCardPaymentsRepo.CreateCreditCardPaymentAsync(creditCardId, paymentAmount, paymentDate)
            .ConfigureAwait(false);

        await _creditCardRepo.PayCreditCardBalanceAsync(creditCardId, paymentAmount, _userContext.UserId).ConfigureAwait(false);
    }
}
