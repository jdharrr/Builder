using DatabaseServices.Models;

namespace BuilderServices;

public static class BuilderUtils
{
    public static readonly Dictionary<int, string> Months = new()
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
                
                return date.Day == startDate.Day;
            case "yearly":
                return date.Month == startDate.Month && date.Day == startDate.Day;
            default:
                return false;
        }
    }

    public static string GetNextFutureDueDate(string recurrenceRate, string currentDueDate, bool dueEndOfMonth = false)
    {
        var nextDueDate = DateOnly.ParseExact(currentDueDate, "yyyy-MM-dd");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        while (nextDueDate < today)
        {
            nextDueDate = GetNextDueDate(recurrenceRate, nextDueDate, dueEndOfMonth);
        }

        return nextDueDate.ToString("yyyy-MM-dd");
    }

    public static DateOnly GetNextDueDate(string recurrenceRate, DateOnly currentDueDate, bool dueEndOfMonth = false)
    {
        if (dueEndOfMonth)
        {
            currentDueDate = currentDueDate.AddDays(1);
            currentDueDate = currentDueDate.AddMonths(1).AddDays(-1);
            return currentDueDate;
        }

        return recurrenceRate switch
        {
            "daily" => currentDueDate.AddDays(1),

            "weekly" => currentDueDate.AddDays(7),

            "monthly" => currentDueDate.AddMonths(1),

            "yearly" => currentDueDate.AddYears(1),

            _ => currentDueDate,
        };
    }
}
