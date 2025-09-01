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

    public function getAllExpensesByUserId($userId): Collection {
        return Expense::query()->where('user_id', $userId)->orderBy('created_at')->get();
    }

    public function getExpensesForDashboardCalendar($userId, $month, $year): array {
        $firstDate = new DateTime($year . '-' . $month . '-01');
        $daysInMonth = $firstDate->format('t');
        $lastDate = new DateTime($year . '-' . $month . '-' . $daysInMonth);

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

        $mappedExpenses = [];
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

    public function getUpcomingExpenses($userId): array {
        $startDateObj = new DateTime();
        $startDateString = $startDateObj->format('Y-m-d');
        $startDateYear = (int)$startDateObj->format('Y');
        $startDateMonth = (int)$startDateObj->format('m');
        $startDateDay = (int)$startDateObj->format('j');
        $daysInCurrentMonth = (int)$startDateObj->format('t');

        $endDateYear = $startDateYear;
        $endDateMonth = $startDateObj->format('m');
        $endDateDay = $startDateDay + 7;
        // List overflows into following month
        if ($endDateDay > $daysInCurrentMonth) {
            $endDateDay -= $daysInCurrentMonth;
            $endDateMonth += 1;
        }
        // List overflows into following year
        if ($endDateMonth === 13) {
            $endDateYear += 1;
            $endDateMonth = 1;
        }

        $endDate = "{$endDateYear}-{$endDateMonth}-{$endDateDay}";
        $expenses = Expense::query()
            ->select('expenses.*', DB::raw('IF(DATE(next_due_date) < CURDATE(), TRUE, FALSE) as is_late'))
            ->where('user_id', $userId)
            ->where('active', true)
            ->whereDate('start_date', '<=', $endDate)
            ->where(function ($query) use ($startDateString) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $startDateString);
            })
            ->where(function ($query) use ($startDateString, $endDate) {
                $query->whereBetween('next_due_date', [$startDateString, $endDate])
                    ->orWhereIn('recurrence_rate', ['daily', 'weekly', 'monthly', 'yearly']);
            })
            ->get();

        $mappedExpenses = [];
        for ($i = $startDateDay; $i < $startDateDay + 7; $i++) {
            $year = $startDateYear;
            $month = $startDateMonth;
            $day = $i;
            if ($daysInCurrentMonth < $day) {
                $month += 1;
                $day -= $daysInCurrentMonth;
            }

            if ($month === 13) {
                $year += 1;
                $month = 1;
            }

            $date = $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT). '-' . str_pad($day, 2, '0', STR_PAD_LEFT);
            $dateObj = new DateTime($date);
            $mappedExpenses[$date] = [];
            foreach ($expenses as $expense) {
                $dueDateObj = new DateTime($expense->next_due_date);
                if (!$this->expenseIsForDate($expense, $dateObj, $dueDateObj)) {
                    continue;
                }

                $mappedExpenses[$date][] = $expense;
                $paymentsForDate = $this->getPaymentsForDate($date, $userId);
                $paymentsMap = array_column($paymentsForDate->toArray(), 'due_date_paid', 'expense_id');
                if (isset($paymentsMap[$expense->id])) {
                    $expense->due_date_paid = $paymentsMap[$expense->id];
                }
            }
        }

        return $mappedExpenses;
    }

    public function expenseIsForDate($expense, $dateObj, $dueDateObj): bool {
        $startDateObj = new DateTime($expense->start_date);
        $endDateObj = $expense->end_date ? new DateTime($expense->end_date) : null;
        if ($startDateObj > $dateObj || (isset($endDateObj) && $endDateObj < $dateObj)) {
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

    private function getPaymentsForDate($date, $userId) : Collection {
        return Payment::query()
            ->where('user_id', $userId)
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
