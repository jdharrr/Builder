<?php

namespace App\Services;

use App\Enums\Expenses\ExpenseSearchColumns;
use App\Enums\Expenses\ExpenseSortOptions;
use App\Enums\Expenses\ExpenseTableActions;
use App\Models\Expense;
use App\Models\ExpensePayment;
use DateInterval;
use DateTime;

class ExpenseService
{
    private Expense $expenses;
    private ExpensePayment $payments;

    public function __construct(Expense $expenses, ExpensePayment $payments)
    {
        $this->expenses = $expenses;
        $this->payments = $payments;
    }

    public function createExpense(array $expenseData): void
    {
        $createData = [
            'name' => $expenseData['name'],
            'description' => $expenseData['description'],
            'categoryId' => $expenseData['categoryId'],
            'cost' => $expenseData['cost'],
            'recurrenceRate' => $expenseData['recurrenceRate'],
            'userId' => $expenseData['userId'],
            'startDate' => $expenseData['startDate'],
            'endDate' => $expenseData['endDate'],
            'paidOnCreation' => $expenseData['paidOnCreation'],
            'initialDatePaid' => $expenseData['initialDatePaid'],
            'dueLastDayOfMonth' => $expenseData['dueLastDayOfMonth'],
        ];

        if ($expenseData['dueLastDayOfMonth']) {
            $createData['startDate'] = substr($expenseData['startDate'], 0, 8) . (new DateTime())->format('t');
        }

        $expenseId = $this->expenses->createExpense($createData);
        if ($expenseId == 0) {
            throw new \Exception("Failed to create expense");
        }

        if ($expenseData['paidOnCreation']) {
            $paidData = [
                'expenseId' => $expenseId,
                'isPaid' => true,
                'dueDate' => $expenseData['startDate'],
                'userId' => $expenseData['userId'],
                'datePaid' => $expenseData['initialDatePaid'],
            ];

            $this->updateExpensePaidStatus($paidData);
        }
    }

    public function getAllExpensesByUserId(array $requestData): array
    {
        $sortEnum = ExpenseSortOptions::fromName($requestData['sort']);
        if ($sortEnum === null) {
            throw new \Exception('Invalid Sort Option');
        }

        $data = [
            'userId' => $requestData['userId'],
            'sort' => $sortEnum->column(),
            'sortDir' => $requestData['sortDir'],
            'showInactiveExpenses' => $requestData['showInactiveExpenses']
        ];

        if ($requestData['searchColumn'] !== null) {
            $searchColumn = ExpenseSearchColumns::fromName($requestData['searchColumn']);
            if ($searchColumn === null) {
                throw new \Exception('Invalid Search Column');
            }

            $data['searchColumn'] = $searchColumn->column();
            $data['searchValue'] = $requestData['searchValue'];
        }

        $expenses = $this->expenses->getAllExpensesByUserId($data);
        foreach ($expenses as &$expense) {
            $expense['tableActions'] = [
                ExpenseTableActions::Pay->name => ExpenseTableActions::Pay->value,
                ExpenseTableActions::Unpay->name => ExpenseTableActions::Unpay->value,
                ExpenseTableActions::Delete->name => ExpenseTableActions::Delete->value,
                ExpenseTableActions::Edit->name => ExpenseTableActions::Edit->value,
                ExpenseTableActions::EditPayments->name => ExpenseTableActions::EditPayments->value,
            ];

            $expense['active'] === 1 ? $expense['tableActions'][ExpenseTableActions::Inactive->name] = ExpenseTableActions::Inactive->value
                                     : $expense['tableActions'][ExpenseTableActions::Active->name] = ExpenseTableActions::Active->value;

            unset($expense);
        }

        return $expenses;
    }

    public function getExpensesForDashboardCalendar(array $requestData): array
    {
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
            $date = $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-' . str_pad($i, 2, '0', STR_PAD_LEFT);
            $dateObj = new DateTime($date);
            $mappedExpenses[$date] = [];
            foreach ($expenses as $expense) {
                if ($this->expenseIsForDate($expense, $dateObj)) {
                    $mappedExpenses[$date][] = $expense;
                }
            }
        }

        return $mappedExpenses;
    }

    public function getUpcomingExpenses($userId): array
    {
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

            $date = $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-' . str_pad($day, 2, '0', STR_PAD_LEFT);
            $dateObj = new DateTime($date);
            $paymentsForDate = $this->getAllPaymentsForDate(['dueDatePaid' => $date, 'userId' => $userId]);
            $mappedExpenses[$date] = [];
            foreach ($expenses as $expense) {
                if (!$this->expenseIsForDate($expense, $dateObj)) {
                    continue;
                }

                $paymentsMap = array_column($paymentsForDate, 'due_date_paid', 'expense_id');
                if (isset($paymentsMap[$expense['id']])) {
                    $expense['due_date_paid'] = $paymentsMap[$expense['id']];
                }

                $mappedExpenses[$date][] = $expense;
            }
        }

        return $mappedExpenses;
    }

    public function expenseIsForDate(array $expense, DateTime $dateObj): bool
    {
        $startDateObj = new DateTime($expense['start_date']);
        $endDateObj = $expense['end_date'] ? new DateTime($expense['end_date']) : null;
        if ($startDateObj > $dateObj || (isset($endDateObj) && $endDateObj < $dateObj)) {
            return false;
        }

        $diffDays = $dateObj->diff($startDateObj)->days;
        switch ($expense['recurrence_rate']) {
            case 'once':
                if (substr($expense['start_date'], 0, 10) == $dateObj->format('Y-m-d')) {
                    return true;
                }
                break;
            case 'weekly':
                if ($diffDays % 7 === 0) {
                    return true;
                }
                break;
            case 'monthly':
                if ($expense['due_end_of_month'] && $dateObj->format('j') == $dateObj->format('t')) {
                    return true;
                }
                if ($dateObj->format('j') == $startDateObj->format('j')) {
                    return true;
                }
                break;
            case 'yearly':
                if ($dateObj->format('m') === $startDateObj->format('m') && $dateObj->format('j') === $startDateObj->format('j')) {
                    return true;
                }
                break;
            default:
                return true;
        }

        return false;
    }

    public function deleteExpense(int $expenseId, int $userId): bool
    {
        return $this->expenses->deleteExpense($expenseId, $userId);
    }

    public function updateExpensePaidStatus(array $requestData): void
    {
        $expenseId = $requestData['expenseId'];
        $isPaid = $requestData['isPaid'];
        $dueDate = $requestData['dueDate'];
        $userId = $requestData['userId'];
        $datePaid = $requestData['datePaid'];

        $expense = $this->expenses->getExpenseById($expenseId, $userId);
        if (!$expense) {
            throw new \Exception("Expense not found");
        }

        if ($isPaid) {
            $paymentExists = $this->payments->getExpensePaymentForDueDate([
                'userId' => $userId,
                'expenseId' => $expenseId,
                'dueDate' => $dueDate
            ]);
            if ($paymentExists) {
                // TODO: Create error response and implement here
                return;
            }

            $paymentData = [
                'expenseId' => $expense['id'],
                'userId' => $expense['user_id'],
                'cost' => $expense['cost'],
                'dueDatePaid' => $dueDate,
                'paymentDate' => $datePaid !== null ? $datePaid : (new Datetime())->format('Y-m-d'),
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

        if ($dueDate == (new DateTime($expense['next_due_date']))->format('Y-m-d')) {
            $this->updateNextDueDate($expense, $isPaid);
        }
    }

    private function updateNextDueDate(array $expense, bool $isFuture): void
    {
        $intervalMap = [
            'daily' => '1D',
            'weekly' => '1W',
            'monthly' => '1M',
            'yearly' => '1Y',
        ];

        $rate = $expense['recurrence_rate'];
        $interval = $intervalMap[$rate] ?? null;
        if (!$interval) {
            $this->expenses->updateExpense(['active' => 0], $expense['id'], $expense['user_id']);
            return;
        }
        $dateInterval = new DateInterval("P$interval");


        $paymentExistsForDueDate = true;
        $currDueDate = new DateTime($expense['next_due_date']);
        while ($paymentExistsForDueDate) {
            if ($expense['recurrence_rate'] === 'monthly' && $expense['due_end_of_month']) {
                $isFuture ? $currDueDate->modify('first day of next month')->modify('last day of this month')
                          : $currDueDate->modify('first day of this month')->modify('last day of previous month');
            } else {
                $isFuture ? $currDueDate->add($dateInterval)
                          : $currDueDate->sub($dateInterval);
            }

            if (isset($expense['end_date']) && $currDueDate->format('Y-m-d') > $expense['end_date']) {
                $this->expenses->updateExpense(['active' => 0], $expense['id'], $expense['user_id']);
                return;
            }

            $paymentExistsForDueDate = $this->payments->getExpensePaymentForDueDate([
                'expenseId' => $expense['id'],
                'dueDate' => $currDueDate->format('Y-m-d'),
                'userId' => $expense['user_id']
            ]);
        }

        $this->expenses->updateExpense(['next_due_date' => $currDueDate->format('Y-m-d')], $expense['id'], $expense['user_id']);
    }

    private function getAllPaymentsForDate(array $requestData): array
    {
        return $this->payments->getPaymentsForDate($requestData);
    }

    // TODO: Get late expenses by checking if payment for date exists
    public function getLateExpenses(int $userId): array
    {
        return $this->expenses->getLateExpenses($userId);
    }

    public function getSortOptions(): array
    {
        $sortOptions = ExpenseSortOptions::cases();
        $optionsMap = [];
        foreach ($sortOptions as $sortOption) {
            $optionsMap[$sortOption->name] = $sortOption->value;
        }

        return $optionsMap;
    }

    public function getSearchableColumns(): array
    {
        // Keep expected order for frontend
        return [
            ExpenseSearchColumns::CreatedDate->name => ExpenseSearchColumns::CreatedDate->value,
            ExpenseSearchColumns::UpdatedDate->name => ExpenseSearchColumns::UpdatedDate->value,
            ExpenseSearchColumns::Category->name => ExpenseSearchColumns::Category->value,
            ExpenseSearchColumns::Name->name => ExpenseSearchColumns::Name->value,
            ExpenseSearchColumns::Cost->name => ExpenseSearchColumns::Cost->value,
            ExpenseSearchColumns::NextDueDate->name => ExpenseSearchColumns::NextDueDate->value,
            ExpenseSearchColumns::RecurrenceRate->name => ExpenseSearchColumns::RecurrenceRate->value,
            ExpenseSearchColumns::StartDate->name => ExpenseSearchColumns::StartDate->value,
            ExpenseSearchColumns::EndDate->name => ExpenseSearchColumns::EndDate->value,
        ];
    }

    public function getExpenseTableActions(): array
    {
        $actions = ExpenseTableActions::cases();
        $actionsMap = [];
        foreach ($actions as $action) {
            $actionsMap[] = $action->name;
        }

        return $actionsMap;
    }

    public function updateActiveStatus(array $requestData): bool
    {
        return $this->expenses->updateExpense(['active' => (int)$requestData['isActive']], $requestData['expenseId'], $requestData['userId']);
    }

    public function getPaymentsForExpense($data): array {
        return $this->payments->getPaymentsForExpenseId($data);
    }
}
