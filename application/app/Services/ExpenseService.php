<?php

namespace App\Services;

use App\Models\Expense;
use DateInterval;
use DateTime;
use Illuminate\Database\Eloquent\Collection;

class ExpenseService {
    public function createExpense($name, $cost, $description, $recurrenceRate, $category, $userId, $nextDueDate): Expense {
        $nextDueDate = new DateTime($nextDueDate);
        $nextDueDate->add(new DateInterval('PT23H59M59S'));
        $expense = new Expense([
            'name' => $name,
            'cost' => $cost,
            'description' => $description,
            'recurrence_rate' => $recurrenceRate,
            'category' => $category,
            'user_id' => $userId,
            'next_due_date' => $nextDueDate,
        ]);
        if (!$expense->save()) {
            throw new \Exception("An error occurred while trying to save the expense");
        }

        return $expense;
    }

    public function getExpensesByUserId($userId): Collection {
        return Expense::query()->where('user_id', $userId)->get();
    }

    public function getExpensesInRange($userId, $dateFrom, $dateTo): Collection {
        $dateFrom = new DateTime($dateFrom);
        $dateTo = new DateTime($dateTo);
        return Expense::query()
                            ->where('user_id', $userId)
                            ->whereBetween('next_due_date', [$dateFrom, $dateTo])
                            ->where('active', true)
                            ->get();
    }

    public function deleteExpense($expenseId): bool {
        if (Expense::destroy($expenseId)) {
            return true;
        }

        return false;
    }
}
