using BuilderRepositories;

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
            PaymentSortOption.PaymentDate => "payment_date",
            PaymentSortOption.DueDate => "due_date_paid",
            PaymentSortOption.ExpenseName => "expense_name",
            PaymentSortOption.Amount => "cost",
            PaymentSortOption.CreditCard => "credit_card",
            PaymentSortOption.Category => "category_name",
            PaymentSortOption.RecurrenceRate => "recurrence_rate",
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
