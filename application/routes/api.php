<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthenticationController;

Route::prefix('users')->group(function() {
    Route::get('/getById/{id}', [UserController::class, 'getById']);
    Route::get('/getExpenses/{id}', [UserController::class, 'getExpenses']);
    Route::get('/getExpensesInRange', [UserController::class, 'getExpensesInRange']);

    Route::post('/createExpense', [UserController::class, 'createExpense']);

    Route::delete('/deleteExpense/{id}', [UserController::class, 'deleteExpense']);
});

Route::prefix('auth')->group(function() {
    Route::post('/createUser', [AuthenticationController::class, 'createUser']);

    Route::delete('/deleteUser/{id}', [AuthenticationController::class, 'deleteUser']);
});
