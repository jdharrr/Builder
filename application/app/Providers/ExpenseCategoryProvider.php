<?php

namespace App\Providers;

use App\Models\ExpenseCategory;
use Illuminate\Support\ServiceProvider;

class ExpenseCategoryProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(ExpenseCategory::class, function ($app) {
            return new ExpenseCategory();
        });
    }

    /**
     * Bootstrap services.
     * Run logic after services is registered
     */
    public function boot(): void
    {
        //
    }
}
