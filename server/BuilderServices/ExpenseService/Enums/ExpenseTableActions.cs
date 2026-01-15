using BuilderRepositories;

namespace BuilderServices.ExpenseService.Enums;

public enum ExpenseTableAction
{
    Active,
    Inactive,
    Pay,
    Unpay,
    Delete,
    Edit
}

public static class ExpenseTableActionsHelper
{
    public static string GetActionText(this ExpenseTableAction action, bool recurrenceIsOnce)
    {
        return action switch
        {
            ExpenseTableAction.Active => "Set Active",
            ExpenseTableAction.Inactive => "Set Inactive",
            ExpenseTableAction.Pay => recurrenceIsOnce ? "Mark as Paid" : "Mark a Date Paid",
            ExpenseTableAction.Unpay => recurrenceIsOnce ? "Mark as Unpaid" : "Mark a Date Unpaid",
            ExpenseTableAction.Delete => "Delete",
            ExpenseTableAction.Edit => "Edit",
            _ => throw new GenericException("Invalid expense table action.")
        };
    }
}