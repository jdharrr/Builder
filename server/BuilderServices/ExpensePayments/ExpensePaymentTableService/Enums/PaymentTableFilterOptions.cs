using BuilderRepositories;
using BuilderServices.Enums;

namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;

public enum PaymentTableFilterOption
{
    PaymentDate,
    DueDate,
    Amount,
    Expense,
    CreditCard
}

public static class PaymentTableFilterOptionsHelper
{
    public static string GetDisplayText(this PaymentTableFilterOption filter)
    {
        return filter switch
        {
            PaymentTableFilterOption.PaymentDate => "Payment Date",
            PaymentTableFilterOption.DueDate => "Due Date",
            PaymentTableFilterOption.Amount => "Amount",
            PaymentTableFilterOption.Expense => "Expense",
            PaymentTableFilterOption.CreditCard => "Credit Card",
            _ => throw new GenericException("Invalid payment table filter.")
        };
    }

    public static TableFilterType GetFilterType(this PaymentTableFilterOption filter)
    {
        return filter switch
        {
            PaymentTableFilterOption.PaymentDate => TableFilterType.DateRange,
            PaymentTableFilterOption.DueDate => TableFilterType.DateRange,
            PaymentTableFilterOption.Amount => TableFilterType.NumberRange,
            PaymentTableFilterOption.Expense => TableFilterType.Text,
            PaymentTableFilterOption.CreditCard => TableFilterType.Text,
            _ => throw new GenericException("Invalid payment table filter.")
        };
    }

    public static string GetFilterColumn(this PaymentTableFilterOption filter)
    {
        return filter switch
        {
            PaymentTableFilterOption.PaymentDate => "payment_date",
            PaymentTableFilterOption.DueDate => "due_date_paid",
            PaymentTableFilterOption.Amount => "cost",
            PaymentTableFilterOption.Expense => "expense_name",
            PaymentTableFilterOption.CreditCard => "credit_company",
            _ => throw new GenericException("Invalid payment table filter.")
        };
    }
}