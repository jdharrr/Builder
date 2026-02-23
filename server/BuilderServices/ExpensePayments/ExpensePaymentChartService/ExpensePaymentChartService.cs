using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.ExpensePayments.ExpensePaymentChartService.Responses;

namespace BuilderServices.ExpensePayments.ExpensePaymentChartService;

public class ExpensePaymentChartService(
    ExpensePaymentRepository paymentRepo,
    UserContext userContext
)
{
    #region Public service methods
    
    public async Task<PaymentMonthlyTotalsResponse> GetMonthlyTotalsByYearAsync(int year, int? categoryId = null)
    {
        var response = new PaymentMonthlyTotalsResponse();

        foreach (var month in BuilderUtils.Months)
        {
            var startDate = new DateOnly(year, month.Key, 1);
            var endDate = new DateOnly(year, month.Key, DateTime.DaysInMonth(year, month.Key));

            response.MonthlyTotals.Add(new PaymentMonthlyTotalItemResponse
            {
                Month = month.Value,
                TotalSpent = await paymentRepo.GetTotalSpentForRangeAsync(
                        userContext.UserId,
                        startDate.ToString("yyyy-MM-dd"),
                        endDate.ToString("yyyy-MM-dd"),
                        categoryId)
                    .ConfigureAwait(false)
            });
        }

        var yearStartDate = new DateOnly(year, 1, 1);
        var yearEndDate = new DateOnly(year, 12, 31);
        response.YearTotalSpent = await paymentRepo.GetTotalSpentForRangeAsync(
                userContext.UserId,
                yearStartDate.ToString("yyyy-MM-dd"),
                yearEndDate.ToString("yyyy-MM-dd"),
                categoryId)
            .ConfigureAwait(false);

        return response;
    }
    
    #endregion
}
