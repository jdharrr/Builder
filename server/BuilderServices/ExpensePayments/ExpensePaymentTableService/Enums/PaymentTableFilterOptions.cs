using BuilderRepositories;
using BuilderRepositories.Enums;
using BuilderRepositories.Exceptions;

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
            PaymentTableFilterOption.Category => TableFilterType.MultiSelect,
            PaymentTableFilterOption.RecurrenceRate => TableFilterType.MultiSelect,
            _ => throw new GenericException("Invalid payment table filter.")
        };
    }

    public static string GetFilterColumn(this PaymentTableFilterOption filter)
    {
        return filter switch
        {
            PaymentTableFilterOption.PaymentDate => "ep.payment_date",
            PaymentTableFilterOption.DueDate => "ep.due_date_paid",
            PaymentTableFilterOption.Amount => "c.cost",
            PaymentTableFilterOption.Expense => "e.name",
            PaymentTableFilterOption.CreditCard => "cc.credit_company",
            PaymentTableFilterOption.Category => "ec.name",
            PaymentTableFilterOption.RecurrenceRate => "e.recurrence_rate",
            _ => throw new GenericException("Invalid payment table filter.")
        };
    }
    
    public static string? GetFilterDropdownApi(this PaymentTableFilterOption filter)
    {
        return filter switch
        {
            PaymentTableFilterOption.Category => "expenses/categories/dropdown",
            PaymentTableFilterOption.RecurrenceRate => "expenses/options/recurrenceRates",
            _ => null
        };
    }
}