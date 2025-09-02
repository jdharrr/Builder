<?php

namespace App\Services;

use App\Models\ExpenseCategory;
use Illuminate\Database\Eloquent\Collection;

class ExpenseCategoryService {
    public function createExpenseCategory($userId, $categoryName): ExpenseCategory {
        $expenseCategory = ExpenseCategory::query()
            ->where('user_id', $userId)
            ->where('name', $categoryName)
            ->first();

        if (!is_null($expenseCategory)) {
            throw new \Exception('Expense Category already exists.', 500);
        }

        $category = new ExpenseCategory([
            'user_id' => $userId,
            'name' => $categoryName
        ]);

        if (!$category->save()) {
            throw new \Exception("An error occurred while trying to save the category");
        }

        return $category;
    }

    public function getAllExpenseCategoriesById($userId): Collection
    {
        return ExpenseCategory::query()->where('user_id', $userId)->get();
    }
}
