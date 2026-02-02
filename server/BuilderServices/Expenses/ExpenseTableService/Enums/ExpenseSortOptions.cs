using BuilderRepositories;

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
            ExpenseSortOption.NextDueDate => "next_due_date",
            ExpenseSortOption.Cost => "cost",
            ExpenseSortOption.Category => "category_name",
            ExpenseSortOption.CreatedDate => "created_at",
            ExpenseSortOption.EndDate => "end_date",
            ExpenseSortOption.UpdatedDate => "updated_at",
            ExpenseSortOption.RecurrenceRate => "recurrence_rate",
            ExpenseSortOption.StartDate => "start_date",
            ExpenseSortOption.Name => "name",
            ExpenseSortOption.Active => "active",
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