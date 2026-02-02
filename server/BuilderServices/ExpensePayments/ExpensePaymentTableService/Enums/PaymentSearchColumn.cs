using BuilderRepositories;

namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;

public enum PaymentSearchColumn
{
    PaymentDate,
    DueDate,
    ExpenseName,
    Amount,
    CreditCard
}

public static class PaymentSearchColumnHelper
{
    public static string GetColumnName(this PaymentSearchColumn column)
    {
        return column switch
        {
            PaymentSearchColumn.PaymentDate => "payment_date",
            PaymentSearchColumn.DueDate => "due_date_paid",
            PaymentSearchColumn.ExpenseName => "expense_name",
            PaymentSearchColumn.Amount => "cost",
            PaymentSearchColumn.CreditCard => "credit_card",
            _ => throw new GenericException("Invalid search column")
        };
    }

    public static string GetDisplayName(this PaymentSearchColumn column)
    {
        return column switch
        {
            PaymentSearchColumn.PaymentDate => "Payment Date",
            PaymentSearchColumn.DueDate => "Due Date Paid",
            PaymentSearchColumn.ExpenseName => "Expense",
            PaymentSearchColumn.Amount => "Amount",
            PaymentSearchColumn.CreditCard => "Credit Card",
            _ => throw new GenericException("Invalid search column")
        };
    }
}