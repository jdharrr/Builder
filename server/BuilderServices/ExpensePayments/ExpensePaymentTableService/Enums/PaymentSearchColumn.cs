using BuilderRepositories;
using BuilderRepositories.Exceptions;

namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;

public enum PaymentSearchColumn
{
    PaymentDate,
    DueDate,
    ExpenseName,
    Amount,
    CreditCard,
    Category,
    RecurrenceRate
}

public static class PaymentSearchColumnHelper
{
    public static string GetColumnName(this PaymentSearchColumn column)
    {
        return column switch
        {
            PaymentSearchColumn.PaymentDate => "ep.payment_date",
            PaymentSearchColumn.DueDate => "ep.due_date_paid",
            PaymentSearchColumn.ExpenseName => "e.name",
            PaymentSearchColumn.Amount => "ep.cost",
            PaymentSearchColumn.CreditCard => "cc.credit_company",
            PaymentSearchColumn.Category => "ec.name",
            PaymentSearchColumn.RecurrenceRate => "e.recurrence_rate",
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
            PaymentSearchColumn.Category => "Category",
            PaymentSearchColumn.RecurrenceRate => "Recurrence",
            _ => throw new GenericException("Invalid search column")
        };
    }
}
