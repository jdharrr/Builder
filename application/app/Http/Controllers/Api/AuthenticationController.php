<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\CreateUserRequest;
use App\Models\User;
use App\Services\AuthenticationService;

class AuthenticationController extends Controller
{
    private AuthenticationService $service;

    public function __construct(AuthenticationService $authenticationService) {
        $this->service = $authenticationService;
    }

    public function index() {}

    public function createUser(CreateUserRequest $request): User {
        try {
            return $this->service->createUser($request->input('username'), $request->input('email'), $request->input('password'));
        }
        catch (\Exception) {
            throw new \Exception("Failed to create user.", 500);
        }
    }

    public function deleteUser($userId): bool {
        return $this->service->deleteUser($userId);
    }

    public function login(LoginRequest $request): string
    {
        try {
            return $this->service->login($request->input('username'), $request->input('password'));
        } catch (\Exception $e) {
            throw new \Exception("Failed to login.", 401);
        }
    }
}
