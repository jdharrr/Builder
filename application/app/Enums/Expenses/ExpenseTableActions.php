<?php

namespace App\Enums\Expenses;

enum ExpenseTableActions: string {
    case Active = 'Set Active';
    case Inactive = 'Set Inactive';
    case Pay = 'Set a Date Paid';
    case Unpay = 'Set a Date Unpaid';
    case Delete = "Delete";
    case Edit = "Edit";
    case EditPayments = "Edit Payments";

    public static function fromName(string $name): ?self
    {
        foreach (self::cases() as $case) {
            if ($case->name === $name) {
                return $case;
            }
        }
        return null;
    }
}
