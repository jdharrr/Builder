<?php

namespace app\Providers;

use Illuminate\Support\ServiceProvider;

use app\Services\ExpenseService;

class ExpenseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(ExpenseService::class, function ($app) {
            return new ExpenseService();
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
