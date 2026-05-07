<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->query('per_page', 25);
        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $logs = ActivityLog::query()
            ->with(['user:id,name,email'])
            ->latest('id')
            ->paginate($perPage)
            ->through(fn (ActivityLog $log) => [
                'id' => $log->id,
                'created_at' => $log->created_at?->toIso8601String(),
                'method' => $log->method,
                'route_name' => $log->route_name,
                'path' => $log->path,
                'status_code' => $log->status_code,
                'user' => $log->user
                    ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'email' => $log->user->email,
                    ]
                    : null,
            ])
            ->withQueryString();

        return Inertia::render('Settings/ActivityLogs/Index', [
            'logs' => $logs,
            'filters' => [
                'per_page' => $perPage,
            ],
        ]);
    }
}
