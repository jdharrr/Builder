using BuilderRepositories;
using BuilderRepositories.Exceptions;

namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;

public enum PaymentSortOption
{
    PaymentDate,
    DueDate,
    ExpenseName,
    Amount,
    CreditCard,
    Category,
    RecurrenceRate
}

public static class PaymentSortOptionsHelper
{
    public static string GetColumnName(this PaymentSortOption option)
    {
        return option switch
        {
            PaymentSortOption.PaymentDate => "ep.payment_date",
            PaymentSortOption.DueDate => "ep.due_date_paid",
            PaymentSortOption.ExpenseName => "e.name",
            PaymentSortOption.Amount => "ep.cost",
            PaymentSortOption.CreditCard => "cc.credit_company",
            PaymentSortOption.Category => "ec.name",
            PaymentSortOption.RecurrenceRate => "e.recurrence_rate",
            _ => throw new GenericException("Invalid sort option")
        };
    }

    public static string GetDisplayName(this PaymentSortOption option)
    {
        return option switch
        {
            PaymentSortOption.PaymentDate => "Payment Date",
            PaymentSortOption.DueDate => "Due Date",
            PaymentSortOption.ExpenseName => "Expense",
            PaymentSortOption.Amount => "Amount",
            PaymentSortOption.CreditCard => "Credit Card",
            PaymentSortOption.Category => "Category",
            PaymentSortOption.RecurrenceRate => "Recurrence",
            _ => throw new GenericException("Invalid sort option")
        };
    }
}
