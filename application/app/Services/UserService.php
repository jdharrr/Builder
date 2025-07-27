<?php

namespace app\Services;

use app\Models\User;

class UserService {
    public function getById($id): User {
        return User::query()->find($id);
    }
}
