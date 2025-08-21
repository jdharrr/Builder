<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Services\UserService;

class UserServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(UserService::class, function ($app) {
            return new UserService();
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
