<?php

namespace App\Http\Controllers\Api\V1;

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
                    'value' => User::query()->active()->whereHas('role', fn ($q) => $q->where('slug', 'admin'))->count(),
                ],
                [
                    'label' => 'Members',
                    'value' => User::query()->active()->whereHas('role', fn ($q) => $q->where('slug', 'user'))->count(),
                ],
                [
                    'label' => 'New (7 days)',
                    'value' => User::query()->active()->where('created_at', '>=', now()->subDays(7))->count(),
                ],
            ],
        ]);
    }
}
