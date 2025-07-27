<?php

namespace App\Services;

use Illuminate\Support\Facades\Hash;

use App\Models\User;
use Mockery\Exception;

class AuthenticationService {
    public function createUser($username, $email, $password): User {
        $password_hash = Hash::make($password);
        $user =  new User(['username' => $username, 'email' => $email, 'password_hash' => $password_hash]);
        if (!$user->save()) {
            throw new Exception('Failed to create user.');
        }

        return $user;
    }

    public function deleteUser($userId) {
        if (User::destroy($userId)) {
            return true;
        }

        return false;
    }
}
