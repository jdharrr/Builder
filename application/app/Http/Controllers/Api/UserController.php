<?php

namespace app\Http\Controllers\Api;

use App\Http\Requests\CreateExpenseRequest;
use app\Models\Expense;
use app\Services\ExpenseService;
use Illuminate\Database\Eloquent\Collection;

use app\Models\User;
use app\Services\UserService;
use Mockery\Exception;

class UserController extends Controller
{
    private UserService $userService;
    private ExpenseService $expenseService;

    public function __construct(UserService $userService, ExpenseService $expenseService) {
        $this->userService = $userService;
        $this->expenseService = $expenseService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Collection
    {
        return User::all();
    }

    /**
     * Get the specified resource.
     */
    public function getById($id): User
    {
        return $this->userService->getById($id);
    }

    /**
     * @throws \Exception
     */
    public function createExpense(CreateExpenseRequest $request): Expense {
        try {
            return $this->expenseService->createExpense(
                $request->input('cost'),
                $request->input('cost'),
                $request->input('description'),
                $request->input('recurring_date'),
                $request->input('recurrence_rate'),
                $request->input('category'),
                $request->input('user_id')
            );
        }
        catch (Exception) {
            throw new \Exception('Failed to create expense.', 500);
        }
    }

    public function getExpenses($userId): Collection {
        return $this->expenseService->getExpensesByUserId($userId);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(): void
    {
        //
    }
}
