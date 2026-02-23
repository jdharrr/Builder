using BuilderRepositories;
using BuilderRepositories.Exceptions;

namespace BuilderServices.Expenses.ExpenseTableService.Enums;

public enum ExpenseSortOption
{
    NextDueDate,
    Cost,
    Category,
    CreatedDate,
    EndDate,
    UpdatedDate,
    RecurrenceRate,
    StartDate,
    Name,
    Active
}

public static class ExpenseSortOptionsHelper
{
    public static string GetColumnName(this ExpenseSortOption option)
    {
        return option switch
        {
            ExpenseSortOption.NextDueDate => "e.next_due_date",
            ExpenseSortOption.Cost => "e.cost",
            ExpenseSortOption.Category => "ec.name",
            ExpenseSortOption.CreatedDate => "e.created_at",
            ExpenseSortOption.EndDate => "e.end_date",
            ExpenseSortOption.UpdatedDate => "e.updated_at",
            ExpenseSortOption.RecurrenceRate => "e.recurrence_rate",
            ExpenseSortOption.StartDate => "e.start_date",
            ExpenseSortOption.Name => "e.name",
            ExpenseSortOption.Active => "e.active",
            _ => throw new GenericException("Invalid sort option")
        };
    }

    public static string GetDisplayName(this ExpenseSortOption option)
    {
        return option switch
        {
            ExpenseSortOption.NextDueDate => "Next Due Date",
            ExpenseSortOption.Cost => "Cost",
            ExpenseSortOption.Category => "Category",
            ExpenseSortOption.CreatedDate => "Created Date",
            ExpenseSortOption.EndDate => "End Date",
            ExpenseSortOption.UpdatedDate => "Updated Date",
            ExpenseSortOption.RecurrenceRate => "Recurrence Rate",
            ExpenseSortOption.StartDate => "Start Date",
            ExpenseSortOption.Name => "Name",
            ExpenseSortOption.Active => "Active",
            _ => throw new GenericException("Invalid sort option")
        };
    }
}