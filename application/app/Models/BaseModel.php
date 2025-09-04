<?php

namespace App\Models;

use Illuminate\Support\Facades\DB;
use PDO;

// TODO: Turn PDO error mode on
class BaseModel {
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = DB::connection()->getPdo();
    }

    protected function insert(string $sql, array $params): bool
    {
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    protected function update(string $sql, array $params): bool
    {
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    protected function delete(string $sql, array $params): bool
    {
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    protected function fetchAll(string $sql, array $params): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    protected function fetchOne(string $sql, array $params): array|null
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $expense = $stmt->fetch(PDO::FETCH_ASSOC);

        return $expense ?: null;
    }

    protected function getLastInsertId(): int
    {
        return $this->pdo->lastInsertId();
    }
}
