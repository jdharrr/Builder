<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthenticationController;

Route::middleware('auth:sanctum')->get('/user', fn () => auth()->user());
Route::middleware('auth:sanctum')->prefix('user')->group(function() {
    Route::get('/getExpenses/{id}', [UserController::class, 'getExpenses']);
    Route::get('/getExpensesInRange', [UserController::class, 'getExpensesInRange']);

    Route::post('/createExpense', [UserController::class, 'createExpense']);

    Route::put('/updateExpensePaidStatus', [UserController::class, 'updateExpensePaidStatus']);

    Route::delete('/deleteExpense/{id}', [UserController::class, 'deleteExpense']);
});

Route::prefix('auth')->group(function() {
    Route::post('/createUser', [AuthenticationController::class, 'createUser']);
    Route::post('/login', [AuthenticationController::class, 'login']);

    Route::delete('/deleteUser/{id}', [AuthenticationController::class, 'deleteUser'])->middleware('auth:sanctum');
});
