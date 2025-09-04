<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\ExpensePayment;
use DateInterval;
use DateTime;

class ExpenseService {
    private Expense $expenses;
    private ExpensePayment $payments;

    public function __construct(Expense $expenses, ExpensePayment $payments) {
        $this->expenses = $expenses;
        $this->payments = $payments;
    }

    public function createExpense(array $expenseData): bool {
        return $this->expenses->createExpense($expenseData);
    }

    public function getAllExpensesByUserId(string $userId): array {
        return $this->expenses->getAllExpensesByUserId($userId);
    }

    public function getExpensesForDashboardCalendar(array $requestData): array {
        $year = $requestData['year'];
        $month = $requestData['month'];

        $firstDate = new DateTime($year . '-' . $month . '-01');
        $daysInMonth = $firstDate->format('t');

        $data = [
            'userId' => $requestData['userId'],
            'firstDate' => $year . '-' . $month . '-01',
            'lastDate' => $year . '-' . $month . '-' . $daysInMonth,
        ];

        $expenses = $this->expenses->getExpensesForDashboard($data);

        $mappedExpenses = [];
        for ($i = 1; $i <= $daysInMonth; $i++) {
            $date = $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT). '-' . str_pad($i, 2, '0', STR_PAD_LEFT);
            $dateObj = new DateTime($date);
            $mappedExpenses[$date] = [];
            foreach ($expenses as $expense) {
                $dueDateObj = new DateTime($expense['next_due_date']);
                if ($this->expenseIsForDate($expense, $dateObj, $dueDateObj)) {
                    $mappedExpenses[$date][] = $expense;
                }
            }
        }

        return $mappedExpenses;
    }

    public function getUpcomingExpenses($userId): array {
        $startDateObj = new DateTime();
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

        $data = [
            'userId' => $userId,
            'firstDate' => $startDateObj->format('Y-m-d'),
            'lastDate' => "{$endDateYear}-{$endDateMonth}-{$endDateDay}",
        ];

        $expenses = $this->expenses->getExpensesForDashboard($data);

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
                $dueDateObj = new DateTime($expense['next_due_date']);
                if (!$this->expenseIsForDate($expense, $dateObj, $dueDateObj)) {
                    continue;
                }

                $mappedExpenses[$date][] = $expense;
                $paymentsForDate = $this->getPaymentsForDate(['dueDatePaid' => $date, 'userId' => $userId]);
                $paymentsMap = array_column($paymentsForDate, 'due_date_paid', 'expense_id');
                if (isset($paymentsMap[$expense['id']])) {
                    $expense['due_date_paid'] = $paymentsMap[$expense['id']];
                }
            }
        }

        return $mappedExpenses;
    }

    public function expenseIsForDate(array $expense, DateTime $dateObj, DateTime $dueDateObj): bool {
        $startDateObj = new DateTime($expense['start_date']);
        $endDateObj = $expense['end_date'] ? new DateTime($expense['end_date']) : null;
        if ($startDateObj > $dateObj || (isset($endDateObj) && $endDateObj < $dateObj)) {
            return false;
        }

        $diffDays = $dateObj->diff($dueDateObj)->days;
        switch ($expense['recurrence_rate']) {
            case 'once':
                if (substr($expense['next_due_date'], 0, 10) == $dateObj->format('Y-m-d')) {
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

    public function deleteExpense(int $expenseId, int $userId): bool {
        return $this->expenses->deleteExpense($expenseId, $userId);
    }

    public function updateExpensePaidStatus(array $requestData): void {
        $expenseId = $requestData['expenseId'];
        $isPaid = $requestData['isPaid'];
        $dueDate = $requestData['dueDate'];
        $userId = $requestData['userId'];

        $expense = $this->expenses->getExpenseById($expenseId, $userId);
        if (!$expense) {
            throw new \Exception("Expense not found");
        }

        if ($isPaid) {
            $paymentData = [
                'expenseId' => $expense['id'],
                'userId' => $expense['user_id'],
                'cost' => $expense['cost'],
                'dueDatePaid' => $dueDate,
                'paymentDate' => new Datetime(),
            ];

            $this->payments->createPayment($paymentData);
        } else {
            $paymentData = [
                'expenseId' => $expense['id'],
                'dueDate' => $dueDate,
                'userId' => $expense['user_id'],
            ];

            $this->payments->deletePaymentForDueDate($paymentData);
        }

        if (new DateTime($dueDate) == (new DateTime($expense['next_due_date']))->format('Y-m-d')) {
            $this->updateNextDueDate($expense, $isPaid);
        }
    }

    private function updateNextDueDate(array $expense, bool $isFuture): void {
        $intervalMap = [
            'daily' => '1D',
            'weekly' => '1W',
            'monthly' => '1M',
            'yearly' => '1Y',
        ];

        $rate = $expense['recurrence_rate'];
        $interval = $intervalMap[$rate] ?? null;

        if ($interval) {
            $currDate = $expense['next_due_date']->copy();
            $dateInterval = new DateInterval("P{$interval}");

            $nextDate = $isFuture ? $currDate->add($dateInterval) : $currDate->sub($dateInterval);
            if ($expense['end_date'] && $nextDate > $expense['end_date']) {
                $this->expenses->updateExpense(['active' => false], $expense['id'], $expense['user_id']);
            } else {
                $this->expenses->updateExpense(['next_due_date' => $nextDate], $expense['id'], $expense['user_id']);
            }
        } else {
            $this->expenses->updateExpense(['active' => false], $expense['id'], $expense['user_id']);
        }
    }

    private function getPaymentsForDate(array $requestData): array {
        return $this->payments->getPaymentsForDate($requestData);
    }

    public function getLateExpenses(int $userId): array {
        return $this->expenses->getLateExpenses($userId);
    }
}
