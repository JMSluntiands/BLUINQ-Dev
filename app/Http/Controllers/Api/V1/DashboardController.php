<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'stats' => [
                [
                    'label' => 'Total users',
                    'value' => User::query()->active()->count(),
                ],
                [
                    'label' => 'Administrators',
                    'value' => User::query()->active()->where('role', UserRole::Admin)->count(),
                ],
                [
                    'label' => 'Members',
                    'value' => User::query()->active()->where('role', UserRole::User)->count(),
                ],
                [
                    'label' => 'New (7 days)',
                    'value' => User::query()->active()->where('created_at', '>=', now()->subDays(7))->count(),
                ],
            ],
        ]);
    }
}
