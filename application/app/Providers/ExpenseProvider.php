<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Models\Expense;
class ExpenseProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(Expense::class, function ($app) {
            return new Expense();
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
