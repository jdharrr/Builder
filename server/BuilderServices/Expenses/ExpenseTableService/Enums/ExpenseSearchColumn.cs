using BuilderRepositories;
using BuilderRepositories.Exceptions;

namespace BuilderServices.Expenses.ExpenseTableService.Enums;

public enum ExpenseSearchColumn
{
    NextDueDate,
    Cost,
    Category,
    CreatedDate,
    EndDate,
    UpdatedDate,
    RecurrenceRate,
    StartDate,
    Name
}

public static class ExpenseSearchColumnHelper
{
    public static string GetColumnName(this ExpenseSearchColumn column)
    {
        return column switch
        {
            ExpenseSearchColumn.NextDueDate => "e.next_due_date",
            ExpenseSearchColumn.Cost => "e.cost",
            ExpenseSearchColumn.Category => "ec.name",
            ExpenseSearchColumn.CreatedDate => "e.created_at",
            ExpenseSearchColumn.EndDate => "e.end_date",
            ExpenseSearchColumn.UpdatedDate => "e.updated_at",
            ExpenseSearchColumn.RecurrenceRate => "e.recurrence_rate",
            ExpenseSearchColumn.StartDate => "e.start_date",
            ExpenseSearchColumn.Name => "e.name",
            _ => throw new GenericException("Invalid search column")
        };
    }

    public static string GetDisplayName(this ExpenseSearchColumn column)
    {
        return column switch
        {
            ExpenseSearchColumn.NextDueDate => "Next Due Date",
            ExpenseSearchColumn.Cost => "Cost",
            ExpenseSearchColumn.Category => "Category",
            ExpenseSearchColumn.CreatedDate => "Created Date",
            ExpenseSearchColumn.EndDate => "End Date",
            ExpenseSearchColumn.UpdatedDate => "Updated Date",
            ExpenseSearchColumn.RecurrenceRate => "Recurrence Rate",
            ExpenseSearchColumn.StartDate => "Start Date",
            ExpenseSearchColumn.Name => "Name",
            _ => throw new GenericException("Invalid search column")
        };
    }
}