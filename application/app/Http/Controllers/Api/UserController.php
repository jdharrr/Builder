<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\CreateExpenseRequest;
use App\Http\Requests\GetExpensesInRangeRequest;
use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Database\Eloquent\Collection;

use App\Models\User;
use App\Services\UserService;

class UserController extends Controller
{
    private UserService $userService;
    private ExpenseService $expenseService;

    public function __construct(UserService $userService, ExpenseService $expenseService) {
        $this->userService = $userService;
        $this->expenseService = $expenseService;
    }

    public function index(): void {}

    public function getById($id): User
    {
        return $this->userService->getById($id);
    }

    public function createExpense(CreateExpenseRequest $request): Expense {
        try {
            return $this->expenseService->createExpense(
                $request->input('name'),
                $request->input('cost'),
                $request->input('description'),
                $request->input('recurrence_rate'),
                $request->input('category'),
                $request->input('user_id'),
                $request->input('next_due_date')
            );
        } catch (\Exception) {
            throw new \Exception('Failed to create expense.', 500);
        }
    }

    public function getExpenses($userId): Collection {
        return $this->expenseService->getExpensesByUserId($userId);
    }

    public function getExpensesInRange(GetExpensesInRangeRequest $request): Collection
    {
        try {
            return $this->expenseService->getExpensesInRange($request->input('userId'), $request->input('dateFrom'), $request->input('dateTo'));
        } catch (\Exception) {
            throw new \Exception('Failed to get expenses in the range.', 500);
        }
    }

    public function deleteExpense($expenseId): bool {
        return $this->expenseService->deleteExpense($expenseId);
    }
}
