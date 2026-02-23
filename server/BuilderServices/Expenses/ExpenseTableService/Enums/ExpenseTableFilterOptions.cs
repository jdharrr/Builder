using BuilderRepositories;
using BuilderRepositories.Enums;
using BuilderRepositories.Exceptions;

namespace BuilderServices.Expenses.ExpenseTableService.Enums;

public enum ExpenseTableFilterOption
{
    CreatedDate,
    UpdatedDate,
    Category,
    Name,
    Cost,
    NextDueDate,
    RecurrenceRate,
    StartDate,
    EndDate
}

public static class ExpenseTableFilterOptionsHelper
{
    public static string GetDisplayText(this ExpenseTableFilterOption filter)
    {
        return filter switch
        {
            ExpenseTableFilterOption.CreatedDate => "Created Date",
            ExpenseTableFilterOption.UpdatedDate => "Updated Date",
            ExpenseTableFilterOption.Category => "Category",
            ExpenseTableFilterOption.Name => "Name",
            ExpenseTableFilterOption.Cost => "Cost",
            ExpenseTableFilterOption.NextDueDate => "Next Due Date",
            ExpenseTableFilterOption.StartDate => "Start Date",
            ExpenseTableFilterOption.EndDate => "End Date",
            ExpenseTableFilterOption.RecurrenceRate => "Recurrence Rate",
            _ => throw new GenericException("Invalid expense table action.")
        };
    }

    public static TableFilterType GetFilterType(this ExpenseTableFilterOption filter)
    {
        return filter switch
        {
            ExpenseTableFilterOption.CreatedDate => TableFilterType.DateRange,
            ExpenseTableFilterOption.UpdatedDate => TableFilterType.DateRange,
            ExpenseTableFilterOption.Category => TableFilterType.MultiSelect,
            ExpenseTableFilterOption.Name => TableFilterType.Text,
            ExpenseTableFilterOption.Cost => TableFilterType.NumberRange,
            ExpenseTableFilterOption.NextDueDate => TableFilterType.DateRange,
            ExpenseTableFilterOption.StartDate => TableFilterType.DateRange,
            ExpenseTableFilterOption.EndDate => TableFilterType.DateRange,
            ExpenseTableFilterOption.RecurrenceRate => TableFilterType.MultiSelect,
            _ => throw new GenericException("Invalid expense table action.")
        };
    }

    public static string GetFilterColumn(this ExpenseTableFilterOption filter)
    {
        return filter switch
        {
            ExpenseTableFilterOption.CreatedDate => "e.created_at",
            ExpenseTableFilterOption.UpdatedDate => "e.updated_at",
            ExpenseTableFilterOption.Category => "ec.name",
            ExpenseTableFilterOption.Name => "e.name",
            ExpenseTableFilterOption.Cost => "e.cost",
            ExpenseTableFilterOption.NextDueDate => "e.next_due_date",
            ExpenseTableFilterOption.StartDate => "e.start_date",
            ExpenseTableFilterOption.EndDate => "e.end_date",
            ExpenseTableFilterOption.RecurrenceRate => "e.recurrence_rate",
            _ => throw new GenericException("Invalid expense table action.")
        };
    }

    public static string? GetFilterDropdownApi(this ExpenseTableFilterOption filter)
    {
        return filter switch
        {
            ExpenseTableFilterOption.Category => "expenses/categories/dropdown",
            ExpenseTableFilterOption.RecurrenceRate => "expenses/options/recurrenceRates",
            _ => null
        };
    }
}
