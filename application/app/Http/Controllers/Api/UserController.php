<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

use App\Http\Requests\UpdateUserSettingsRequest;
use App\Models\User;
use App\Services\UserService;

class UserController extends Controller
{
    private UserService $service;

    public function __construct(UserService $userService) {
        $this->service = $userService;
    }

    public function getUserById(Request $request): User {
        return $this->service->getUserById($request->user()->id);
    }

    public function updateSettings(UpdateUserSettingsRequest $request): bool
    {
        try {
            return $this->service->updateSettings($request->user()->id, $request->input('dark_mode'));
        } catch(\Exception $e) {
            throw new \Exception('Failed to update dark mode', 500);
        }
    }
}
