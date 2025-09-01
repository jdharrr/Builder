<?php

namespace App\Http\Controllers\Api;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Http\Requests\CreateExpenseRequest;
use App\Http\Requests\GetExpensesForDashboardCalendarRequest;
use App\Models\Expense;
use App\Services\ExpenseService;
use App\Http\Requests\UpdateExpensePaidStatusRequest;
use App\Http\Requests\GetExpensesForDateRequest;
use App\Http\Requests\GetPaymentsForDateRequest;

class ExpenseController extends Controller
{
    private ExpenseService $service;

    public function __construct(ExpenseService $expenseService) {
        $this->service = $expenseService;
    }

    public function index(): void {}

    public function createExpense(CreateExpenseRequest $request): Expense {
        try {
            return $this->service->createExpense(
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

    public function getExpensesForDashboardCalendar(GetExpensesForDashboardCalendarRequest $request): array {
        $userId = $request->user()->id;
        try {
            return $this->service->getExpensesForDashboardCalendar(
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
            return $this->service->deleteExpense($expenseId);
        } catch (\Exception) {
            throw new \Exception('Failed to delete expense.', 500);
        }
    }

    public function updateExpensePaidStatus(UpdateExpensePaidStatusRequest $request): JsonResponse
    {
        try {
            $this->service->updateExpensePaidStatus($request->input('expense_id'), $request->input('is_paid'), $request->input('due_date'));
        } catch (\Exception) {
            throw new \Exception('Failed to update expense paid.', 500);
        }

        return response()->json([
            'success' => true
        ]);
    }

    public function getLateExpenses(Request $request): Collection {
        try {
            return $this->service->getLateExpenses($request->user()->id);
        } catch (\Exception) {
            throw new \Exception('Failed to get expenses paid.', 500);
        }
    }

    public function getUpcomingExpenses(Request $request): array
    {
        try {
            return $this->service->getUpcomingExpenses($request->user()->id);
        } catch (\Exception) {
            throw new \Exception('Failed to get upcoming expenses.', 500);
        }
    }

    public function getAllExpenses(Request $request): Collection
    {
        try {
            return $this->service->getAllExpensesByUserId($request->user()->id);
        } catch(\Exception $e) {
            throw new \Exception('Failed to get expenses.', 500);
        }
    }
}
