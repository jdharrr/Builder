using BuilderRepositories;

namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;

public enum PaymentTableAction
{
    DeletePayment
}

public static class PaymentTableActionHelper
{
    public static string GetDisplayName(this PaymentTableAction option)
    {
        return option switch
        {
            PaymentTableAction.DeletePayment => "Delete Payment",
            _ => throw new GenericException("Invalid payment action")
        };
    }
}