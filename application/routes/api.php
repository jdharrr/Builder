<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthenticationController;

Route::prefix('auth')->group(function() {
    Route::post('/createUser', [AuthenticationController::class, 'createUser']);
    Route::post('/login', [AuthenticationController::class, 'login']);

    Route::delete('/deleteUser/{id}', [AuthenticationController::class, 'deleteUser'])->middleware('auth:sanctum');
});


Route::middleware('auth:sanctum')->prefix('user')->group(function() {
    Route::get('/', [UserController::class, 'getUserById']);
    Route::patch('/update/settings', [UserController::class, 'updateSettings']);
});

Route::middleware('auth:sanctum')->prefix('expenses')->group(function() {
    Route::get('/expensesForDashboardCalendar', [ExpenseController::class, 'getExpensesForDashboardCalendar']);
    Route::get('/paymentsForDate', [ExpenseController::class, 'getPaymentsForDate']);
    Route::get('/expensesForDate', [ExpenseController::class, 'getExpensesForDate']);
    Route::get('/lateExpenses', [ExpenseController::class, 'getLateExpenses']);

    Route::post('/createExpense', [ExpenseController::class, 'createExpense']);

    Route::patch('/update/paidStatus', [ExpenseController::class, 'updateExpensePaidStatus']);

    Route::delete('/deleteExpense/{id}', [ExpenseController::class, 'deleteExpense']);
});
