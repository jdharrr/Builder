using BuilderRepositories;

namespace BuilderServices.ExpenseService.Enums;

public enum ExpenseTableAction
{
    Active,
    Inactive,
    Pay,
    Unpay,
    Delete,
    Edit,
    EditPayments
}

public static class ExpenseTableActionsHelper
{
    public static string GetActionText(this ExpenseTableAction action)
    {
        return action switch
        {
            ExpenseTableAction.Active => "Set Active",
            ExpenseTableAction.Inactive => "Set Inactive",
            ExpenseTableAction.Pay => "Mark a Date Paid",
            ExpenseTableAction.Unpay => "Mark a Date Unpaid ",
            ExpenseTableAction.Delete => "Delete",
            ExpenseTableAction.Edit => "Edit",
            ExpenseTableAction.EditPayments => "Edit Payments",
            _ => throw new GenericException("Invalid expense table action.")
        };
    }
}