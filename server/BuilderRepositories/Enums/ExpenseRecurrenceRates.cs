using BuilderRepositories.Exceptions;

namespace BuilderRepositories.Enums;

public enum ExpenseRecurrenceRate
{
    Once,
    Daily,
    Weekly,
    Monthly,
    Yearly
}

public static class ExpenseRecurrenceRatesHelper
{
    public static string GetRepoValue(this ExpenseRecurrenceRate rate)
    {
        return rate switch
        {
            ExpenseRecurrenceRate.Once => "once",
            ExpenseRecurrenceRate.Daily => "daily",
            ExpenseRecurrenceRate.Weekly => "weekly",
            ExpenseRecurrenceRate.Monthly => "monthly",
            ExpenseRecurrenceRate.Yearly => "yearly",
            _ => throw new GenericException("Invalid recurrence rate.")
        };
    }
}
