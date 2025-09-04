<?php

namespace App\Services;

use App\Models\ExpenseCategory;
use Illuminate\Database\Eloquent\Collection;

class ExpenseCategoryService {
    private ExpenseCategory $expenseCategories;

    public function __construct(ExpenseCategory $expenseCategories)
    {
        $this->expenseCategories = $expenseCategories;
    }

    public function createExpenseCategory($requestData): bool
    {
        $categoryData =[
            'name' => $requestData['name'],
            'userId' => $requestData['userId']
        ];

        return $this->expenseCategories->createExpenseCategory($categoryData);
    }

    public function getAllExpenseCategoriesById($userId): array
    {
        return $this->expenseCategories->getExpenseCategoriessByUserId($userId);
    }
}
