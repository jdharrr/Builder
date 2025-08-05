<?php

namespace App\Http\Controllers\Api;

use Illuminate\Database\Eloquent\Collection;

use App\Http\Requests\CreateExpenseRequest;
use App\Http\Requests\GetExpensesInRangeRequest;
use App\Models\Expense;
use App\Services\ExpenseService;
use App\Services\UserService;
use App\Http\Requests\UpdateExpensePaidStatusRequest;

class UserController extends Controller
{
    private UserService $userService;
    private ExpenseService $expenseService;

    public function __construct(UserService $userService, ExpenseService $expenseService) {
        $this->userService = $userService;
        $this->expenseService = $expenseService;
    }

    public function index(): void {}

    public function createExpense(CreateExpenseRequest $request): Expense {
        $userId = $request->user()->id;
        try {
            return $this->expenseService->createExpense(
                $request->input('name'),
                $request->input('cost'),
                $request->input('description'),
                $request->input('recurrence_rate'),
                $request->input('category'),
                $userId,
                $request->input('next_due_date')
            );
        } catch (\Exception) {
            throw new \Exception('Failed to create expense.', 500);
        }
    }

    public function getExpenses($userId): Collection {
        return $this->expenseService->getExpensesByUserId($userId);
    }

    public function getExpensesInRange(GetExpensesInRangeRequest $request): Collection {
        $userId = $request->user()->id;
        try {
            return $this->expenseService->getExpensesInRange($userId, $request->input('dateFrom'), $request->input('dateTo'));
        } catch (\Exception) {
            throw new \Exception('Failed to get expenses in the range.', 500);
        }
    }

    public function deleteExpense($expenseId): bool {
        return $this->expenseService->deleteExpense($expenseId);
    }

    public function updateExpensePaidStatus(UpdateExpensePaidStatusRequest $request): Expense {
        return $this->expenseService->updateExpensePaidStatus($request->input('expenseId'), $request->input('isPaid'));
    }
}
