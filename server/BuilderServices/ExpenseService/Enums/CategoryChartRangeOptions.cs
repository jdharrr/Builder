using BuilderRepositories;

namespace BuilderServices.ExpenseService.Enums;

public enum CategoryChartRangeOption
{
    AllTime,
    ThisWeek,
    ThisMonth,
    ThisYear,
    LastSixMonths
}

public static class CategoryChartRangeOptionsHelper
{
    public static string GetDisplayName(this CategoryChartRangeOption option)
    {
        return option switch
        {
            CategoryChartRangeOption.AllTime => "All Time",
            CategoryChartRangeOption.ThisWeek => "This Week",
            CategoryChartRangeOption.ThisMonth => "This Month",
            CategoryChartRangeOption.ThisYear => "This Year",
            CategoryChartRangeOption.LastSixMonths => "Last 6 Months",
            _ => throw new GenericException("Invalid category chart range option")
        };
    }
}
