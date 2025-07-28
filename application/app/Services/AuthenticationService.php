<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Hash;

use App\Models\User;

class AuthenticationService {
    public function createUser($username, $email, $password): User {
        $usernameExists = User::query()->where('username', $username)->first();
        if ($usernameExists) {
            throw new Exception('Username already exists');
        }

        $password_hash = Hash::make($password);
        $user =  new User(['username' => $username, 'email' => $email, 'password_hash' => $password_hash]);
        if (!$user->save()) {
            throw new Exception('Failed to create user.');
        }

        return $user;
    }

    public function deleteUser($userId): bool {
        if (User::destroy($userId)) {
            return true;
        }

        return false;
    }

    public function login($username, $password): string
    {
        $user = User::query()->where('username', $username)->first();
        if (!$user) {
            throw new Exception('Username and password do not match.');
        }
        if (!Hash::check($password, $user->password_hash)) {
            throw new Exception('Username and password do not match.');
        }

        return $user->createToken('accessToken')->plainTextToken;
    }
}
