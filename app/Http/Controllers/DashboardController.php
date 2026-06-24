<?php

namespace App\Http\Controllers;

use App\Http\Controllers\AnnouncementController;
use App\Models\User;
use App\Services\AttendanceService;
use App\Services\DraftingRequestBoardService;
use App\Services\LeaveService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private AttendanceService $attendance,
        private DraftingRequestBoardService $board,
        private LeaveService $leave,
    ) {}

    public function index(Request $request): Response
    {
        $user = auth()->user();
        $boardQuery = $this->board->baseQuery($request);

        $calendarMonth = $request->string('calendar_month')->toString();
        $month = preg_match('/^\d{4}-\d{2}$/', $calendarMonth)
            ? Carbon::createFromFormat('Y-m', $calendarMonth)->startOfMonth()
            : Carbon::today()->startOfMonth();
        [$calendarStart, $calendarEnd] = $this->leave->monthGridRange($month);

        $jobStatusDate = $request->string('job_status_date')->toString();
        $jobStatusDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', $jobStatusDate)
            ? $jobStatusDate
            : Carbon::today(config('app.timezone'))->format('Y-m-d');

        $leaderboardMonth = $request->string('leaderboard_month')->toString();
        $leaderboardMonth = preg_match('/^\d{4}-\d{2}$/', $leaderboardMonth)
            ? $leaderboardMonth
            : Carbon::today(config('app.timezone'))->format('Y-m');

        return Inertia::render('Dashboard', [
            'boardPreviewJobs' => $user?->hasPermission('job.list.view')
                ? $boardQuery
                    ->where('is_priority', true)
                    ->limit(5)
                    ->get()
                    ->map(function ($row) use ($request) {
                        $formatted = $this->board->formatBoardRow($row);
                        $formatted['can_assign'] = $this->board->canAssignStaff($request, $row);

                        return $formatted;
                    })
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
            'canApplyLeave' => $user?->hasPermission('leave.apply') ?? false,
            'canManageLeave' => $user?->hasPermission('leave.manage') ?? false,
            'leaveCalendar' => $user
                ? $this->leave->calendarPayload($calendarStart, $calendarEnd)
                : [],
            'calendarMonth' => $month->format('Y-m'),
            'onLeaveToday' => $user
                ? $this->leave->onLeaveToday()
                : [],
            'jobStatusChart' => $user?->hasPermission('job.list.view')
                ? $this->board->jobStatusChartPayload($request, $jobStatusDate)
                : null,
            'drafterLeaderboard' => $user?->hasPermission('job.list.view')
                ? $this->board->drafterLeaderboardPayload($request, $leaderboardMonth)
                : null,
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
