<?php

use Illuminate\Support\Facades\Route;

use app\Http\Controllers\Api\UserController;
use app\Http\Controllers\Api\AuthenticationController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('users')->group(function() {
    Route::get('/getById/{id}', [UserController::class, 'getById']);
    Route::get('/getExpenses/{id}', [UserController::class, 'getExpenses']);
    Route::post('/createExpense', [UserController::class, 'createExpense']);
});

Route::prefix('auth')->group(function() {
    Route::post('/createUser', [AuthenticationController::class, 'createUser']);
});
