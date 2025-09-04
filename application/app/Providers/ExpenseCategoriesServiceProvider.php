<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Services\ExpenseCategoryService;
use App\Services\AuthenticationService;

class ExpenseCategoriesServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(ExpenseCategoryService::class);
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
