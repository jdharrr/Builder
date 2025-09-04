<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseCategory extends BaseModel
{
    public function createExpenseCategory(array $categoryData): bool
    {
        $nameCheckSql = "SELECT id FROM expense_categories
                         WHERE name = :name
                             AND user_id = :userId";
        $nameCheckParams = [
            ':name' => $categoryData['name'],
            ':userId' => $categoryData['userId']
        ];
        if ($this->fetchOne($nameCheckSql, $nameCheckParams)) {
            throw new \Exception("Expense Category already exists");
        }

        $sql = "INSERT INTO expense_categories (
                    name,
                    user_id
                ) VALUES (
                    :name,
                    :userId
                )";
        $params = [
            ':name' => $categoryData['name'],
            ':userId' => $categoryData['userId'],
        ];

        return $this->insert($sql, $params);
    }

    public function getExpenseCategoriessByUserId(int $userId): array
    {
        $sql = "SELECT * FROM expense_categories WHERE user_id = :userId";
        $params = [
            ":userId" => $userId
        ];

        return $this->fetchAll($sql, $params);
    }
}
