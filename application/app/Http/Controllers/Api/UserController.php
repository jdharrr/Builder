<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\UpdateDarkModeRequest;
use Illuminate\Http\Request;

use App\Services\UserService;

class UserController extends Controller
{
    private UserService $service;

    public function __construct(UserService $userService)
    {
        $this->service = $userService;
    }

    public function getUserById(Request $request): array
    {
        try {
            return $this->service->getUserById($request->user()->id);
        } catch (\Exception $e) {
            throw new \Exception("Failed to get user");
        }
    }

    public function updateDarkMode(UpdateDarkModeRequest $request): bool
    {
        try {
            return $this->service->updateDarkMode(['userId' => $request->user()->id, 'darkMode' => $request->input('darkMode')]);
        } catch(\Exception $e) {
            throw new \Exception('Failed to update dark mode', 500);
        }
    }
}
