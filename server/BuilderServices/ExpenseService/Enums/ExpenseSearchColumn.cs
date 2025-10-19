using BuilderRepositories;

namespace BuilderServices.ExpenseService.Enums;

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
            ExpenseSearchColumn.NextDueDate => "next_due_date",
            ExpenseSearchColumn.Cost => "cost",
            ExpenseSearchColumn.Category => "category_id",
            ExpenseSearchColumn.CreatedDate => "created_at",
            ExpenseSearchColumn.EndDate => "end_date",
            ExpenseSearchColumn.UpdatedDate => "updated_at",
            ExpenseSearchColumn.RecurrenceRate => "recurrence_rate",
            ExpenseSearchColumn.StartDate => "start_date",
            ExpenseSearchColumn.Name => "name",
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