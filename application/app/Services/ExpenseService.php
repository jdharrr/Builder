<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Collection;

use App\Models\Expense;
use App\Models\Payment;
use DateInterval;
use DateTime;
use Illuminate\Support\Facades\DB;

class ExpenseService {
    public function createExpense($name, $cost, $description, $recurrenceRate, $category, $userId, $nextDueDate, $startDate, $endDate): Expense {
        $nextDueDate = new DateTime($nextDueDate);
        $expense = new Expense([
            'name' => $name,
            'cost' => $cost,
            'description' => $description,
            'recurrence_rate' => $recurrenceRate,
            'category' => $category,
            'user_id' => $userId,
            'next_due_date' => $nextDueDate,
            'start_date' => $startDate,
        ]);
        if ($endDate) {
            $expense->end_date = $endDate;
        }

        if (!$expense->save()) {
            throw new \Exception("An error occurred while trying to save the expense");
        }

        return $expense;
    }

    public function getExpensesByUserId($userId): Collection {
        return Expense::query()->where('user_id', $userId)->get();
    }

    public function getExpensesForDashboardCalendar($userId, $month, $year): array {
        $firstDate = new DateTime($year . '-' . $month . '-01');
        $daysInMonth = $firstDate->format('t');
        $lastDate = new DateTime($year . '-' . $month . '-' . $daysInMonth);

        $mappedExpenses = [];
        $expenses =  Expense::query()
            ->select('expenses.*', DB::raw('IF(DATE(next_due_date) < CURDATE(), TRUE, FALSE) as is_late'))
            ->where('user_id', $userId)
            ->where('active', true)
            ->whereDate('start_date', '<=', $lastDate)
            ->where(function ($query) use ($firstDate) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $firstDate);
            })
            ->where(function ($query) use ($firstDate, $lastDate) {
                $query->whereBetween('next_due_date', [$firstDate, $lastDate])
                    ->orWhereIn('recurrence_rate', ['daily', 'weekly', 'monthly', 'yearly']);
            })
            ->get();

        for ($i = 1; $i <= $daysInMonth; $i++) {
            $date = $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT). '-' . str_pad($i, 2, '0', STR_PAD_LEFT);
            $dateObj = new DateTime($date);
            $mappedExpenses[$date] = [];
            foreach ($expenses as $expense) {
                $dueDateObj = new DateTime($expense->next_due_date);
                if ($this->expenseIsForDate($expense, $dateObj, $dueDateObj)) {
                    $mappedExpenses[$date][] = $expense;
                }
            }
        }

        return $mappedExpenses;
    }

    public function getExpensesForDate($userId, $date): array {
        $expenses = Expense::query()
            ->select('expenses.*', DB::raw('IF(DATE(next_due_date) < CURDATE(), TRUE, FALSE) AS is_late'))
            ->where('user_id', $userId)
            ->where('active', true)
            ->whereDate('start_date', '<=', $date)
            ->where(function ($query) use ($date) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $date);
            })
            ->where(function ($query) use ($date) {
                $query->whereDate('next_due_date', $date)
                    ->orWhereIn('recurrence_rate', ['daily', 'weekly', 'monthly', 'yearly']);
            })
            ->get();

        $expensesForDate = [];
        $dateObj = new DateTime($date);
        foreach ($expenses as $expense) {
            $dueDateObj = new DateTime($expense->next_due_date);
            if ($this->expenseIsForDate($expense, $dateObj, $dueDateObj)) {
                $expensesForDate[] = $expense;
            }
        }

        return $expensesForDate;
    }

    public function expenseIsForDate($expense, $dateObj, $dueDateObj): bool {
        if ($expense->start_date > $dateObj || $expense->end_date && $expense->end_date < $dateObj) {
            return false;
        }

        $diffDays = $dateObj->diff($dueDateObj)->days;
        switch ($expense->recurrence_rate) {
            case 'once':
                if ($expense->next_due_date == $dateObj) {
                    return true;
                }
                break;
            case 'weekly':
                if ($diffDays % 7 === 0) {
                    return true;
                }
                break;
            case 'monthly':
                if ($dateObj->format('j') === $dueDateObj->format('j')) {
                    return true;
                }
                break;
            case 'yearly':
                if ($dateObj->format('m') === $dueDateObj->format('m') && $dateObj->format('j') === $dueDateObj->format('j')) {
                    return true;
                }
                break;
            default:
                return true;
        }

        return false;
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
            if ($expense->end_date && $nextDate > $expense->end_date) {
                $expense->update(['active' => false]);
            } else {
                $expense->update(['next_due_date' => $nextDate]);
            }
        } else {
            $expense->update(['active' => false]);
        }
    }

    public function getPaymentsForDate($date, $userId, $expenseIds) : Collection {
        return Payment::query()
            ->where('user_id', $userId)
            ->whereIn('expense_id', $expenseIds)
            ->whereDate('due_date_paid', $date)
            ->get();
    }

    public function getLateExpenses($userId): Collection {
        return Expense::query()
            ->where('user_id', $userId)
            ->where('active', true)
            ->whereDate('next_due_date', '<', new DateTime())
            ->get();
    }
}
