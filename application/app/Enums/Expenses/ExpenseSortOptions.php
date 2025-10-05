<?php

namespace App\Enums\Expenses;

enum ExpenseSortOptions: string
{
    case NextDueDate = 'Next Due Date';
    Case Cost = 'Cost';
    case Category = 'Category';
    case CreatedDate = 'Created Date';
    case EndDate = 'End Date';
    case  UpdatedDate = 'Updated Date';
    case RecurrenceRate = 'Recurrence Rate';
    case StartDate = 'Start Date';
    case Name = 'Name';
    case Active = 'Active';

    public function column(): string {
        return match($this) {
            self::NextDueDate => 'next_due_date',
            self::Cost => 'cost',
            self::Category => 'category',
            self::CreatedDate => 'created_at',
            self::EndDate => 'end_date',
            self::RecurrenceRate => 'recurrence_rate',
            self::StartDate => 'start_date',
            self::Active => 'active',
            self::Name => 'name',
            self::UpdatedDate => 'updated_at',
        };
    }

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
