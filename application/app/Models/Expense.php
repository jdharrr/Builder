<?php

namespace App\Models;

use DateTime;

class Expense extends BaseModel
{
    public function createExpense(array $expenseData): bool {
        // TODO: Handle paid on creation logic
        $nameCheckSql = "SELECT id FROM expenses WHERE name = :name AND user_id = :user_id";
        $nameCheckParams = ['name' => $expenseData['name'], 'user_id' => $expenseData['userId']];
        if ($this->fetchOne($nameCheckSql, $nameCheckParams)) {
            throw new \Exception("Name already exists.");
        }

        $sql = "INSERT INTO expenses (
                    name,
                    cost,
                    description,
                    recurrence_rate,
                    next_due_date,
                    user_id,
                    start_date,
                    end_date,
                    category_id
                ) VALUES (
                    :name,
                    :cost,
                    :description,
                    :recurrenceRate,
                    :nextDueDate,
                    :userId,
                    :startDate,
                    :endDate,
                    :categoryId
                )";
        $params = [
            ':name' => $expenseData['name'],
            ':cost' => $expenseData['cost'],
            ':description' => $expenseData['description'],
            ':recurrenceRate' => $expenseData['recurrenceRate'],
            ':categoryId' => $expenseData['categoryId'],
            ':userId' => $expenseData['userId'],
            ':nextDueDate' => $expenseData['nextDueDate'],
            ':startDate' => $expenseData['startDate'],
            ':endDate' => $expenseData['endDate'],
        ];

        return $this->insert($sql, $params);
    }

    public function deleteExpense(int $expenseId, int $userId): bool {
        $sql = "DELETE FROM expenses
                WHERE id = :expenseId
                    AND user_id = :userId";
        $params = [
            ':expenseId' => $expenseId,
            ':userId' => $userId
        ];

        return $this->delete($sql, $params);
    }

    public function getAllExpensesByUserId(array $data): array {
        $params = [
            ':userId' => $data['userId'],
        ];

        $sort = $data['sort'] === 'category' ? "c.name" : "e." . $data['sort'];
        $sortDir = $data['sortDir'] === 'asc' ? "ASC" : "DESC";

        $selectFrom = "SELECT e.*, c.name as category_name, c.id as category_id FROM expenses e";

        $join = " LEFT JOIN expense_categories c ON e.category_id = c.id";

        $where = " WHERE e.user_id = :userId";

        // Column searching
        if (array_key_exists('searchValue', $data) && array_key_exists('searchColumn', $data)) {
            $col = $data['searchColumn'] === 'category' ? "c.name" : "e." . $data['searchColumn'];
            $where .= " AND $col LIKE :searchValue";

            $escaped = str_replace(['\\','%','_'], ['\\\\','\\%','\\_'], $data['searchValue']);
            $params[':searchValue'] = "%{$escaped}%";
        }

        $orderBy = " ORDER BY $sort $sortDir, e.id DESC";

        $sql = $selectFrom . $join . $where . $orderBy;

        return $this->fetchAll($sql, $params);
    }

    public function getExpensesForDashboard(array $data): array {
        $userId = $data['userId'];
        $firstDate = $data['firstDate'];
        $lastDate = $data['lastDate'];

        $sql = "SELECT e.*, c.name as category_name, c.id as category_id, IF(DATE(e.next_due_date) < CURDATE(), TRUE, FALSE) as is_late
                FROM expenses e
                LEFT JOIN expense_categories c ON e.category_id = c.id
                WHERE e.user_id = :userId
                    AND DATE(e.start_date) <= :lastDate
                    AND (e.end_date IS NULL OR e.end_date >= :firstDate)
                    AND (
                        DATE(e.next_due_date) BETWEEN :firstDateCopy AND :lastDateCopy
                        OR e.recurrence_rate IN ('daily', 'weekly', 'monthly', 'yearly')
                    )
                ";
        $params = [
            ':userId' => $userId,
            ':firstDate' => $firstDate,
            ':firstDateCopy' => $firstDate,
            ':lastDate' => $lastDate,
            ':lastDateCopy' => $lastDate,
        ];

        return $this->fetchAll($sql, $params);
    }

    public function getExpenseById(int $expenseId, int $userId): array|null {
        $sql = "SELECT e.*, c.name as category_name, c.id as category_id
                FROM expenses e
                LEFT JOIN expense_categories c ON e.category_id = c.id
                WHERE e.id = :expenseId
                    AND e.user_id = :userId";
        $params = [
            ':expenseId' => $expenseId,
            ':userId' => $userId
        ];

        return $this->fetchOne($sql, $params);
    }

    // Keys of $data MUST match column names of expenses table
    public function updateExpense(array $updateColumnData, int $expenseId, int $userId): bool
    {
        $allowedUpdate = [
            'name',
            'cost',
            'description',
            'last_cost',
            'cost_updated_at',
            'next_due_date',
            'active',
            'start_date',
            'end_date',
            'category_id',
            'recurrence_rate'
        ];

        if (count(array_filter(array_keys($updateColumnData), fn($d) => in_array($d, $allowedUpdate))) === 0) {
            throw new \Exception("Invalid update request.");
        }

        $sql = "UPDATE expenses SET ";

        foreach ($updateColumnData as $key => $value) {
            if (!in_array($key, $allowedUpdate)) continue;
            $sql .= "$key = :$key,";
        }

        $sql = substr($sql, 0, -1);
        $sql .= " WHERE id = :expenseId AND user_id = :userId";
        $params = [
            ':expenseId' => $expenseId,
            ':userId' => $userId
        ];
        foreach ($updateColumnData as $key => $value) {
            if (!in_array($key, $allowedUpdate)) continue;
            $params[":$key"] = $value;
        }

        return $this->update($sql, $params);
    }

    public function getLateExpenses(int $userId): array {
        $dateNow = new DateTime();
        $sql = "SELECT e.*, c.name as category_name, c.id as category_id FROM expenses e
                LEFT JOIN expense_categories c ON e.category_id = c.id
                WHERE e.user_id = :userId
                AND e.active = 1
                AND DATE(e.next_due_date) < :dateNow";
        $params = [
            ':userId' => $userId,
            ':dateNow' => $dateNow->format('Y-m-d')
        ];

        return $this->fetchAll($sql, $params);
    }
}
