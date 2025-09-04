<?php

namespace App\Providers;

use App\Models\UserSettings;
use Illuminate\Support\ServiceProvider;

class UserSettingsProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(UserSettings::class, function ($app) {
            return new UserSettings();
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
