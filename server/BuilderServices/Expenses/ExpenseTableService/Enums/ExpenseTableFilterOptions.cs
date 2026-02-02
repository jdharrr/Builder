using BuilderRepositories;
using BuilderServices.Enums;

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
            ExpenseTableFilterOption.Category => TableFilterType.Text,
            ExpenseTableFilterOption.Name => TableFilterType.Text,
            ExpenseTableFilterOption.Cost => TableFilterType.NumberRange,
            ExpenseTableFilterOption.NextDueDate => TableFilterType.DateRange,
            ExpenseTableFilterOption.StartDate => TableFilterType.DateRange,
            ExpenseTableFilterOption.EndDate => TableFilterType.DateRange,
            ExpenseTableFilterOption.RecurrenceRate => TableFilterType.Text,
            _ => throw new GenericException("Invalid expense table action.")
        };
    }

    public static string GetFilterColumn(this ExpenseTableFilterOption filter)
    {
        return filter switch
        {
            ExpenseTableFilterOption.CreatedDate => "created_at",
            ExpenseTableFilterOption.UpdatedDate => "updated_at",
            ExpenseTableFilterOption.Category => "category_name",
            ExpenseTableFilterOption.Name => "name",
            ExpenseTableFilterOption.Cost => "cost",
            ExpenseTableFilterOption.NextDueDate => "next_due_date",
            ExpenseTableFilterOption.StartDate => "start_date",
            ExpenseTableFilterOption.EndDate => "end_date",
            ExpenseTableFilterOption.RecurrenceRate => "recurrence_rate",
            _ => throw new GenericException("Invalid expense table action.")
        };
    }
}
