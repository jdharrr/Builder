using BuilderRepositories;

namespace BuilderServices.ExpenseService.Enums;

public enum ExpenseTableBatchAction
{
    UpdateCategory
}

public static class ExpenseTableBatchActionHelper
{
    public static string GetDisplayName(this ExpenseTableBatchAction action)
    {
        return action switch
        {
            ExpenseTableBatchAction.UpdateCategory => "Update Category",
            _ => throw new GenericException("Invalid batch action")
        };
    }
}
