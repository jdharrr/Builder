<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\CreateExpenseCategoryRequest;
use App\Models\ExpenseCategory;
use App\Services\ExpenseCategoryService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Http\Requests\CreateExpenseRequest;
use App\Http\Requests\GetExpensesForDashboardCalendarRequest;
use App\Models\Expense;
use App\Services\ExpenseService;
use App\Http\Requests\UpdateExpensePaidStatusRequest;

class ExpenseController extends Controller
{
    private ExpenseService $expenseService;
    private ExpenseCategoryService $expenseCategoryService;

    public function __construct(ExpenseService $expenseService, ExpenseCategoryService $expenseCategoryService) {
        $this->expenseService = $expenseService;
        $this->expenseCategoryService = $expenseCategoryService;
    }

    public function index(): void {}

    public function createExpense(CreateExpenseRequest $request): Expense {
        try {
            return $this->expenseService->createExpense(
                $request->input('name'),
                $request->input('cost'),
                $request->input('description'),
                $request->input('recurrence_rate'),
                $request->input('category_id'),
                $request->user()->id,
                $request->input('next_due_date'),
                $request->input('start_date'),
                $request->input('end_date')
            );
        } catch (\Exception $e) {
            throw new \Exception('Failed to create expense.', 500);
        }
    }

    public function getExpensesForDashboardCalendar(GetExpensesForDashboardCalendarRequest $request): array {
        $userId = $request->user()->id;
        try {
            return $this->expenseService->getExpensesForDashboardCalendar(
                $userId,
                $request->input('month'),
                $request->input('year')
            );
        } catch (\Exception) {
            throw new \Exception('Failed to get expenses in the range.', 500);
        }
    }

    public function deleteExpense($expenseId): bool {
        try {
            return $this->expenseService->deleteExpense($expenseId);
        } catch (\Exception) {
            throw new \Exception('Failed to delete expense.', 500);
        }
    }

    public function updateExpensePaidStatus(UpdateExpensePaidStatusRequest $request): JsonResponse
    {
        try {
            $this->expenseService->updateExpensePaidStatus($request->input('expense_id'), $request->input('is_paid'), $request->input('due_date'));
        } catch (\Exception) {
            throw new \Exception('Failed to update expense paid.', 500);
        }

        return response()->json([
            'success' => true
        ]);
    }

    public function getLateExpenses(Request $request): Collection {
        try {
            return $this->expenseService->getLateExpenses($request->user()->id);
        } catch (\Exception) {
            throw new \Exception('Failed to get expenses paid.', 500);
        }
    }

    public function getUpcomingExpenses(Request $request): array
    {
        try {
            return $this->expenseService->getUpcomingExpenses($request->user()->id);
        } catch (\Exception) {
            throw new \Exception('Failed to get upcoming expenses.', 500);
        }
    }

    public function getAllExpenses(Request $request): Collection
    {
        try {
            return $this->expenseService->getAllExpensesByUserId($request->user()->id);
        } catch(\Exception $e) {
            throw new \Exception('Failed to get expenses.', 500);
        }
    }

    public function createExpenseCategory(CreateExpenseCategoryRequest $request): ExpenseCategory
    {
        try {
            return $this->expenseCategoryService->createExpenseCategory($request->user()->id, $request->input('name'));
        } catch (\Exception) {
            throw new \Exception('Failed to create expense category.', 500);
        }
    }

    public function getAllExpenseCategories(Request $request): Collection
    {
        try {
            return $this->expenseCategoryService->getAllExpenseCategoriesById($request->user()->id);
        } catch (\Exception) {
            throw new \Exception('Failed to get expense categories.', 500);
        }
    }
}
