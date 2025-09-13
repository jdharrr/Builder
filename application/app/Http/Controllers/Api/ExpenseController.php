<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\CreateExpenseCategoryRequest;
use App\Http\Requests\GetAllExpensesRequest;
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

    public function __construct(ExpenseService $expenseService, ExpenseCategoryService $expenseCategoryService)
    {
        $this->expenseService = $expenseService;
        $this->expenseCategoryService = $expenseCategoryService;
    }

    public function index(): void {}

    public function createExpense(CreateExpenseRequest $request): bool
    {
        $expenseData = [
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'categoryId' => $request->input('categoryId'),
            'cost' => $request->input('cost'),
            'recurrenceRate' => $request->input('recurrenceRate'),
            'userId' => $request->user()->id,
            'nextDueDate' => $request->input('nextDueDate'),
            'startDate' => $request->input('startDate'),
            'endDate' => $request->input('endDate'),
            'paidOnCreation' => $request->input('paidOnCreation'),
        ];

        try {
            return $this->expenseService->createExpense($expenseData);
        } catch (\Exception $e) {
            throw new \Exception('Failed to create expense.', 500);
        }
    }

    public function getExpensesForDashboardCalendar(GetExpensesForDashboardCalendarRequest $request): array
    {
        $requestData = [
            'userId' => $request->user()->id,
            'year' => $request->input('year'),
            'month' => $request->input('month'),
        ];

        try {
            return $this->expenseService->getExpensesForDashboardCalendar($requestData);
        } catch (\Exception $e) {
            throw new \Exception('Failed to get expenses in the range.', 500);
        }
    }

    public function deleteExpense(Request $request, $expenseId): bool
    {
        try {
            return $this->expenseService->deleteExpense($expenseId, $request->user()->id);
        } catch (\Exception) {
            throw new \Exception('Failed to delete expense.', 500);
        }
    }

    public function updateExpensePaidStatus(UpdateExpensePaidStatusRequest $request): JsonResponse
    {
        $requestData = [
            'expenseId' => $request->input('expenseId'),
            'isPaid' => $request->input('isPaid'),
            'dueDate' => $request->input('dueDate'),
            'userId' => $request->user()->id,
        ];

        try {
            $this->expenseService->updateExpensePaidStatus($requestData);
        } catch (\Exception $e) {
            throw new \Exception('Failed to update expense paid.', 500);
        }

        return response()->json([
            'success' => true
        ]);
    }

    public function getLateExpenses(Request $request): array
    {
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

    public function getAllExpenses(GetAllExpensesRequest $request): array
    {
        $requestData = [
            'userId' => $request->user()->id,
            'sort' => $request->input('sort'),
            'sortDir' => $request->input('sortDir'),
            'searchColumn' => $request->input('searchColumn'),
            'searchValue' => $request->input('searchValue'),
        ];

        try {
            return $this->expenseService->getAllExpensesByUserId($requestData);
        } catch(\Exception $e) {
            throw new \Exception('Failed to get expenses.', 500);
        }
    }

    public function createExpenseCategory(CreateExpenseCategoryRequest $request): bool
    {
        try {
            return $this->expenseCategoryService->createExpenseCategory(['userId' => $request->user()->id, 'name' => $request->input('name')]);
        } catch (\Exception) {
            throw new \Exception('Failed to create expense category.', 500);
        }
    }

    public function getAllExpenseCategories(Request $request): array
    {
        try {
            return $this->expenseCategoryService->getAllExpenseCategoriesById($request->user()->id);
        } catch (\Exception) {
            throw new \Exception('Failed to get expense categories.', 500);
        }
    }

    public function getExpenseSortOptions(): array {
        try {
            return $this->expenseService->getSortOptions();
        } catch(\Exception) {
            throw new \Exception('Failed to get sort options.', 500);
        }
    }
}
