<?php


namespace App\Models;

use DateTime;

class ExpensePayment extends BaseModel
{
    // TODO: Go through all sql stmts and user explicit select commands instead of * and alias to camel case
    public function createPayment(array $paymentData): bool {
        $sql = "INSERT INTO expense_payments (
                    expense_id,
                    user_id,
                    cost,
                    due_date_paid,
                    payment_date
                ) VALUES (
                    :expenseId,
                    :userId,
                    :cost,
                    :dueDatePaid,
                    :paymentDate
                )";
        $params = [
            ':expenseId' => $paymentData['expenseId'],
            ':userId' => $paymentData['userId'],
            ':cost' => $paymentData['cost'],
            ':dueDatePaid' => $paymentData['dueDatePaid'],
            ':paymentDate' => $paymentData['paymentDate']
        ];

        return $this->insert($sql, $params);
    }

    public function deletePaymentForDueDate($paymentData): bool {
        $sql = "DELETE FROM expense_payments
                WHERE user_id = :userId
                    AND DATE(due_date_paid) = :dueDate
                    AND expense_id = :expenseId";
        $params = [
            ':expenseId' => $paymentData['expenseId'],
            ':dueDate' => $paymentData['dueDate'],
            ':userId' => $paymentData['userId']
        ];

        return $this->delete($sql, $params);
    }

    public function getPaymentsForDate($data): array {
        $userId = $data['userId'];
        $dueDatePaid = $data['dueDatePaid'];

        $sql = "SELECT * FROM expense_payments
                WHERE user_id = :userId
                AND due_date_paid = :dueDatePaid";
        $params = [
            ':userId' => $userId,
            ':dueDatePaid' => $dueDatePaid
        ];

        return $this->fetchAll($sql, $params);
    }

    public function getExpensePaymentForDueDate($expenseData): array|null {
        $sql = "SELECT id FROM expense_payments
                WHERE user_id = :userId
                  AND due_date_paid = :dueDate
                  AND expense_id = :expenseId";
        $params = [
            ':userId' => $expenseData['userId'],
            ':expenseId' => $expenseData['expenseId'],
            ':dueDate' => $expenseData['dueDate']
        ];

        return $this->fetchOne($sql, $params);
    }

    public function getPaymentsForExpenseId($data): array {
        $sql = "SELECT * FROM expense_payments WHERE user_id = :userId AND expense_id = :expenseId";
        $params = [
            ':userId' => $data['userId'],
            ':expenseId' => $data['expenseId']
        ];

        return $this->fetchAll($sql, $params);
    }
}
