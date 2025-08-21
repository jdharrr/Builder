<?php

namespace App\Http\Controllers\Api;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Http\Requests\CreateExpenseRequest;
use App\Http\Requests\GetExpensesForDashboardCalendarRequest;
use App\Models\Expense;
use App\Services\ExpenseService;
use App\Services\UserService;
use App\Http\Requests\UpdateExpensePaidStatusRequest;
use App\Http\Requests\GetExpensesForDateRequest;
use App\Http\Requests\GetPaymentsForDateRequest;

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
        try {
            return $this->expenseService->createExpense(
                $request->input('name'),
                $request->input('cost'),
                $request->input('description'),
                $request->input('recurrence_rate'),
                $request->input('category'),
                $request->user()->id,
                $request->input('next_due_date'),
                $request->input('start_date'),
                $request->input('end_date')
            );
        } catch (\Exception) {
            throw new \Exception('Failed to create expense.', 500);
        }
    }

    public function getExpenses($userId): Collection {
        return $this->expenseService->getExpensesByUserId($userId);
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
            $this->expenseService->updateExpensePaidStatus($request->input('expenseId'), $request->input('isPaid'), $request->input('dueDate'));
        } catch (\Exception) {
            throw new \Exception('Failed to update expense paid.', 500);
        }

        return response()->json([
            'success' => true
        ]);
    }

    public function getPaymentsForDate(GetPaymentsForDateRequest $request): Collection
    {
        try {
            return $this->expenseService->getPaymentsForDate($request->input('date'), $request->user()->id, $request->input('expenseIds'));
        } catch (\Exception) {
            throw new \Exception('Failed to get expenses paid.', 500);
        }
    }

    public function getExpensesForDate(GetExpensesForDateRequest $request): array {
        try {
            return $this->expenseService->getExpensesForDate($request->user()->id, $request->input('date'));
        } catch (\Exception) {
            throw new \Exception('Failed to get expenses paid.', 500);
        }
    }

    public function getLateExpenses(Request $request): Collection {
        try {
            return $this->expenseService->getLateExpenses($request->user()->id);
        } catch (\Exception) {
            throw new \Exception('Failed to get expenses paid.', 500);
        }
    }
}
