<?php

namespace App\Services;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Hash;

use App\Models\EloquentUser;

class AuthenticationService {
    private User $users;

    public function __construct(User $users)
    {
        $this->users = $users;
    }

    public function createUser($requestData): string
    {
        $userData = [
            'username' => $requestData['username'],
            'email' => $requestData['email'],
            'password' => $requestData['password'],
        ];
        $userId = $this->users->createUser($userData);
        $user = $this->users->getEloquentUserById($userId);

        return $user->createToken('accessToken')->accessToken;
    }

    public function deleteUser($userId): bool
    {
        if (EloquentUser::destroy($userId)) {
            return true;
        }

        return false;
    }

    public function login($requestData): string
    {
        $user = $this->users->getEloquentUserByUsername($requestData['username']);
        if (!Hash::check($requestData['password'], $user->password_hash)) {
            throw new Exception('Username and password do not match.');
        }

        return $user->createToken('accessToken')->plainTextToken;
    }
}
