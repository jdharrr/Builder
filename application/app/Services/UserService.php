<?php

namespace App\Services;

use App\Models\EloquentUser;
use App\Models\User;
use App\Models\UserSettings;

class UserService {
    private User $users;

    private UserSettings $userSettings;

    public function __construct(User $users, UserSettings $userSettings)
    {
        $this->users = $users;
        $this->userSettings = $userSettings;
    }

    public function getUserById($id): array
    {
        return $this->users->getUserById($id);
    }

    public function updateDarkMode($requestData): bool
    {
        $updatedColumnData = [
            'dark_mode' => $requestData['darkMode'] ? 1 : 0
        ];

        return $this->userSettings->updateUserSettings($updatedColumnData, $requestData['userId']);
    }
}
