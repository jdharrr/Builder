<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Collection;

use App\Models\Expense;
use App\Models\Payment;
use DateInterval;
use DateTime;
use DateTimeZone;

class ExpenseService {
    public function createExpense($name, $cost, $description, $recurrenceRate, $category, $userId, $nextDueDate): Expense {
        $nextDueDate = new DateTime($nextDueDate);
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

    public function updateExpensePaidStatus($expenseId, $isPaid, $dueDate): void {
        $expense = Expense::query()->find($expenseId)->firstOrFail();
        if ($isPaid) {
            $payment = new Payment(
                [
                    'expense_id' => $expenseId,
                    'user_id' => $expense->user->id,
                    'cost' => $expense->cost,
                    'due_date_paid' => $dueDate,
                    'payment_date' => new Datetime(),
                ]
            );
            try {
                $payment->save();
            } catch (\Exception $e) {
                echo $e->getMessage();
            }
        } else {
            try {
                $payment = Payment::query()
                    ->where('expense_id', $expenseId)
                    ->whereDate('due_date_paid', $dueDate)
                    ->select('id')
                    ->firstOrFail();
            } catch (\Exception $e) {
                echo $e->getMessage();
            }

            Payment::destroy($payment->id);
        }

        if (new DateTime($dueDate) == new DateTime($expense->next_due_date)) {
            $this->updateNextDueDate($expense, $isPaid);
        }
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

    public function getPaymentsForDate($date, $userId, $expenseIds) : Collection {
        return Payment::query()
            ->where('user_id', $userId)
            ->whereIn('expense_id', $expenseIds)
            ->whereDate('due_date_paid', $date)
            ->get();
    }
}
