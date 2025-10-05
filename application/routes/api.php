<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthenticationController;

Route::prefix('auth')->group(function() {
    Route::get('/validateAccessToken', function() {
        // If user can access this endpoint, access token is valid
        return response()->json(['valid' => true]);
    })->middleware('auth:sanctum');

    Route::post('/createUser', [AuthenticationController::class, 'createUser']);
    Route::post('/login', [AuthenticationController::class, 'login']);

    Route::delete('/deleteUser/{id}', [AuthenticationController::class, 'deleteUser'])
        ->where('id', '[0-9]+')
        ->middleware('auth:sanctum');
});


Route::middleware('auth:sanctum')->prefix('user')->group(function() {
    Route::get('/', [UserController::class, 'getUserById']);
    Route::patch('/update/settings/darkMode', [UserController::class, 'updateDarkMode']);
});

Route::middleware('auth:sanctum')->prefix('expenses')->group(function() {
    // Expenses
    Route::get('/expensesForDashboardCalendar', [ExpenseController::class, 'getExpensesForDashboardCalendar']);
    Route::get('/lateExpenses', [ExpenseController::class, 'getLateExpenses']);
    Route::get('/getUpcomingExpenses', [ExpenseController::class, 'getUpcomingExpenses']);
    Route::get('/getAllExpenses', [ExpenseController::class, 'getAllExpenses']);

    Route::post('/createExpense', [ExpenseController::class, 'createExpense']);

    Route::prefix('update')->group(function() {
        Route::patch('/paidStatus', [ExpenseController::class, 'updateExpensePaidStatus']);
        Route::patch('/activeStatus', [ExpenseController::class, 'updateExpenseActiveStatus']);
    });

    Route::delete('/deleteExpense', [ExpenseController::class, 'deleteExpense']);

    // Expense Categories
    Route::prefix('categories')->group(function () {
        Route::get('/', [ExpenseController::class, 'getAllExpenseCategories']);

        Route::post('/create', [ExpenseController::class, 'createExpenseCategory']);
    });

    // Expense page options
    Route::prefix('page')->group(function () {
       Route::get('/sortOptions', [ExpenseController::class, 'getExpenseSortOptions']);
       Route::get('/searchableColumns', [ExpenseController::class, 'getExpenseSearchableColumns']);
       Route::get('/tableActions', [ExpenseController::class, 'getExpenseTableActions']);
    });

    // Payments
    Route::prefix('expensePayments')->group(function () {
        Route::get('/{date}', [ExpenseController::class, 'getPaymentsForDate'])
            ->where('date', '^\d{4}-\d{2}-\d{2}$');
        Route::get('/paymentsForExpense', [ExpenseController::class, 'getPaymentsForExpense']);
    });
});
