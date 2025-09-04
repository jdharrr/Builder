<?php

namespace App\Models;

use Illuminate\Support\Facades\Hash;

class User extends BaseModel
{
    public function createUser(array $userData): int
    {
        $usernameCheckSql = "SELECT username FROM users WHERE username = :username";
        $usernameCheckParams = [':username' => $userData['username']];
        if ($this->fetchOne($usernameCheckSql, $usernameCheckParams)) {
            throw new \Exception('Username already exists');
        }

        $emailCheckSql = "SELECT email FROM users WHERE email = :email";
        $emailCheckParams = [':email' => $userData['email']];
        if ($this->fetchOne($emailCheckSql, $emailCheckParams)) {
            throw new \Exception('Email already exists');
        }

        $sql = "INSERT INTO users (
                   username,
                   email,
                   password
                ) VALUES (
                    :username,
                    :email,
                    :password
                )";
        $passwordHash = Hash::make($userData['password']);
        $params = [
            ':username' => $userData['username'],
            ':email' => $userData['email'],
            ':password' => $passwordHash
        ];

        $created = $this->insert($sql, $params);
        if (!$created) {
            throw new \Exception('Failed to create user');
        }

        $userId = $this->getLastInsertId();

        $settingsSql = "INSERT INTO settings (user_id) VALUES (:userId)";
        $settingsParams = [':userId' => $userId];
        $this->insert($settingsSql, $settingsParams);

        return $userId;
    }

    public function getEloquentUserByUsername($username): EloquentUser
    {
        $user = EloquentUser::query()->where('username', $username)->first();
        if (!$user) {
            throw new \Exception('Username and password do not match.');
        }

        return $user;
    }

    public function getEloquentUserById($userId): EloquentUser
    {
        return EloquentUser::query()->where('id', $userId)->first();
    }

    public function getUserById(int $id): array
    {
        $sql = "SELECT u.id,
                       u.username,
                       u.email,
                       u.created_at,
                       u.updated_at,
                       s.id,
                       s.dark_mode,
                       s.updated_at as settings_updated_at
                FROM users u
                LEFT JOIN user_settings s ON u.id = s.user_id
                WHERE u.id = :id";
        $params = [':id' => $id];

        return $this->fetchOne($sql, $params);
    }
}
