<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Services\ExpenseService;

class ExpenseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(ExpenseService::class);
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
