<?php

namespace app\Services;

use app\Models\Expense;
use Illuminate\Database\Eloquent\Collection;

class ExpenseService {
    public function createExpense($name, $cost, $description, $recurring_date, $recurrence_rate, $category, $user_id): Expense {
        $expense = new Expense([
            'name' => $name,
            'cost' => $cost,
            'description' => $description,
            'recurring_date' => $recurring_date,
            'recurrence_rate' => $recurrence_rate,
            'category' => $category,
            'user_id' => $user_id
        ]);
        $expense->save();

        return $expense;
    }

    public function getExpensesByUserId($userId): Collection {
        return Expense::query()->where('user_id', $userId)->get();
    }
}
