<?php

namespace App\Providers;

use App\Models\ExpensePayment;
use Illuminate\Support\ServiceProvider;

class ExpensePaymentProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(ExpensePayment::class, function ($app) {
            return new ExpensePayment();
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
