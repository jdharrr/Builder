<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSettings;

class UserService {
    public function getUserById($id): User {
        return User::query()->find($id)->with(['settings'])->first();
    }

    public function updateSettings($userId, $darkMode): bool
    {
        $settings = UserSettings::query()->where('user_id', $userId)->first();
        return $this->safeUpdate($settings, ['dark_mode' => $darkMode]);
    }

    private function safeUpdate($settings, $cols): bool {
        $clean = array_filter($cols, fn ($val) => !is_null($val));
        return $settings->update($clean);
    }
}
