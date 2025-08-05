<?php

namespace App\Services;

use App\Models\Expense;
use DateInterval;
use DateTime;
use DateTimeZone;
use Illuminate\Database\Eloquent\Collection;

class ExpenseService {
    public function createExpense($name, $cost, $description, $recurrenceRate, $category, $userId, $nextDueDate): Expense {
        // TODO: Date is sending back next due date as day before for some serialization reason
        $nextDueDate = new DateTime($nextDueDate, new DateTimeZone('UTC'));
        $nextDueDate->setTime(23, 59, 59);
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

    public function updateExpensePaidStatus($expenseId, $isPaid): Expense {
        $expense = Expense::query()->where('id', $expenseId)->firstOrFail();
        if (!$isPaid) {
            $this->updateNextDueDate($expense, false);
            $expense->update([
                'last_paid' => $expense->prev_last_paid,
                'prev_last_paid' => null
            ]);
        } else {
            $this->updateNextDueDate($expense, true);
            $expense->update([
                'last_paid' => new DateTime(),
                'prev_last_paid' => $expense->last_paid
            ]);
        }

        return $expense;
    }

    private function updateNextDueDate($expense, $isFuture): void {
        $intervalMap = [
            'daily' => '1D',
            'weekly' => '1W',
            'monthly' => '1M',
            'yearly' => '1Y',
        ];

        $rate = $expense->recurrence_rate;
        $interval = $intervalMap[$rate] ?? null;

        if ($interval) {
            $currDate = $expense->next_due_date->copy();
            $dateInterval = new DateInterval("P{$interval}");

            $nextDate = $isFuture ? $currDate->add($dateInterval) : $currDate->sub($dateInterval);
            $expense->update(['next_due_date' => $nextDate]);
        } else {
            $expense->update(['next_due_date' => null]);
        }
    }
}
