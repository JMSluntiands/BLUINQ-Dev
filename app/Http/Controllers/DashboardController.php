<?php

namespace App\Http\Controllers;

use App\Http\Controllers\AnnouncementController;
use App\Models\User;
use App\Services\AttendanceService;
use App\Services\DraftingRequestBoardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private AttendanceService $attendance,
        private DraftingRequestBoardService $board,
    ) {}

    public function index(Request $request): Response
    {
        $user = auth()->user();
        $boardQuery = $this->board->baseQuery($request);

        return Inertia::render('Dashboard', [
            'boardPreviewJobs' => $user?->hasPermission('job.list.view')
                ? $boardQuery
                    ->limit(5)
                    ->get()
                    ->map(fn ($row) => $this->board->formatBoardRow($row))
                    ->values()
                    ->all()
                : [],
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
            'attendance' => $this->attendance->dashboardAttendancePayload(),
            'clock' => $user
                ? $this->attendance->clockStateForUser($user)
                : null,
            'announcements' => $user?->hasPermission('announcements.view')
                ? AnnouncementController::latestForDashboard()
                : [],
            'canViewAnnouncements' => $user?->hasPermission('announcements.view') ?? false,
            'canManageAnnouncements' => $user?->hasPermission('announcements.manage') ?? false,
        ]);
    }

    public function clockIn(Request $request): RedirectResponse
    {
        $user = $request->user();
        $record = $this->attendance->todayForUser($user);

        if ($record->clock_in_at !== null) {
            return back()->with('status', 'already-clocked-in');
        }

        $record->update([
            'clock_in_at' => now('UTC'),
        ]);

        return back()->with('status', 'clocked-in');
    }

    public function clockOut(Request $request): RedirectResponse
    {
        $user = $request->user();
        $record = $this->attendance->todayForUser($user);

        if ($record->clock_in_at === null) {
            return back()->with('status', 'clock-in-required');
        }

        if ($record->clock_out_at !== null) {
            return back()->with('status', 'already-clocked-out');
        }

        $record->update([
            'clock_out_at' => now('UTC'),
        ]);

        return back()->with('status', 'clocked-out');
    }
}
