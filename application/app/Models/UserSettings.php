<?php

namespace App\Models;

class UserSettings extends BaseModel
{
    // Keys of $data MUST match column names of expenses table
    public function updateUserSettings(array $updateColumnData, int $userId): bool
    {
        $allowedUpdate = [
            'dark_mode'
        ];

        if (count(array_filter(array_keys($updateColumnData), fn($d) => in_array($d, $allowedUpdate))) === 0) {
            throw new \Exception("Invalid update request.");
        }

        $sql = "UPDATE user_settings SET ";

        foreach ($updateColumnData as $key => $value) {
            if (!in_array($key, $allowedUpdate)) continue;
            $sql .= "$key = :$key,";
        }

        $sql = substr($sql, 0, -1);
        $sql .= " WHERE user_id = :userId";
        $params = [
            ':userId' => $userId
        ];
        foreach ($updateColumnData as $key => $value) {
            if (!in_array($key, $allowedUpdate)) continue;
            $params[":$key"] = $value;
        }

        return $this->update($sql, $params);
    }
}
