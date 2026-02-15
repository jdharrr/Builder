using AuthenticationServices;
using BuilderRepositories;
using BuilderServices.ExpensePayments.ExpensePaymentChartService.Responses;

namespace BuilderServices.ExpensePayments.ExpensePaymentChartService;

public class ExpensePaymentChartService(
    ExpensePaymentRepository paymentRepo,
    UserContext userContext
)
{
    public async Task<PaymentMonthlyTotalsResponse> GetMonthlyTotalsByYearAsync(int year, int? categoryId = null)
    {
        var months = new Dictionary<int, string>
        {
            { 1, "January" },
            { 2, "February" },
            { 3, "March" },
            { 4, "April" },
            { 5, "May" },
            { 6, "June" },
            { 7, "July" },
            { 8, "August" },
            { 9, "September" },
            { 10, "October" },
            { 11, "November" },
            { 12, "December" }
        };

        var response = new PaymentMonthlyTotalsResponse();

        foreach (var month in months)
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
}
