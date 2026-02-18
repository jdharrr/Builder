using DatabaseServices.Models;

namespace BuilderServices;

public static class BuilderUtils
{
    public static bool ExpenseIsForDate(ExpenseDto dto, DateOnly date)
    {
        var startDate = DateOnly.ParseExact(dto.StartDate, "yyyy-MM-dd");
        var endDate = dto.EndDate is not null ? DateOnly.ParseExact(dto.EndDate, "yyyy-MM-dd") : (DateOnly?)null;
        if (startDate > date || (endDate < date))
            return false;

        var diffDays = startDate.DayNumber - date.DayNumber;
        switch (dto.RecurrenceRate)
        {
            case "daily":
                return true;
            case "once":
                return startDate == date;
            case "weekly":
                return diffDays % 7 == 0;
            case "monthly":
                if (dto.DueEndOfMonth && date.Day == DateTime.DaysInMonth(date.Year, date.Month))
                    return true;
                if (date.Day == startDate.Day)
                    return true;
                return false;
            case "yearly":
                return date.Month == startDate.Month && date.Day == startDate.Day;
            default:
                return false;
        }
    }

    public static string GetNextFutureDueDate(string recurrenceRate, string currentDueDate)
    {
        var nextDueDate = DateOnly.ParseExact(currentDueDate, "yyyy-MM-dd");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        while (nextDueDate < today)
        {
            nextDueDate = recurrenceRate switch
            {
                "daily" => nextDueDate.AddDays(1),

                "weekly" => nextDueDate.AddDays(7),

                "monthly" => nextDueDate.AddMonths(1),

                "yearly" => nextDueDate.AddYears(1),

                _ => nextDueDate,
            };
        }

        return nextDueDate.ToString("yyyy-MM-dd");
    }
}
