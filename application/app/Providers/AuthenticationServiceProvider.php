<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Services\AuthenticationService;

class AuthenticationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(AuthenticationService::class);
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
