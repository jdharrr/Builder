using BuilderRepositories;
using BuilderServices.Enums;

namespace BuilderServices.ExpensePayments.ExpensePaymentTableService.Enums;

public enum PaymentTableFilterOption
{
    PaymentDate,
    DueDate,
    Amount,
    Expense,
    CreditCard,
    Category,
    RecurrenceRate
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
            PaymentTableFilterOption.Category => "Category",
            PaymentTableFilterOption.RecurrenceRate => "Recurrence Rate",
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
            PaymentTableFilterOption.Category => TableFilterType.Text,
            PaymentTableFilterOption.RecurrenceRate => TableFilterType.Text,
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
            PaymentTableFilterOption.Category => "category_name",
            PaymentTableFilterOption.RecurrenceRate => "recurrence_rate",
            _ => throw new GenericException("Invalid payment table filter.")
        };
    }
}