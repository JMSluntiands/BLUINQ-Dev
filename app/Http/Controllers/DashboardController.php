<?php

namespace App\Http\Controllers;

use App\Http\Controllers\AnnouncementController;
use App\Http\Requests\StoreDashboardActivityRequest;
use App\Models\DraftingRequest;
use App\Services\AttendanceService;
use App\Services\CalendarEventService;
use App\Services\DraftingRequestBoardService;
use App\Services\HolidayService;
use App\Services\LeaveService;
use App\Services\WeeklyTimesheetService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private AttendanceService $attendance,
        private CalendarEventService $calendarEvents,
        private DraftingRequestBoardService $board,
        private HolidayService $holidays,
        private LeaveService $leave,
        private WeeklyTimesheetService $timesheet,
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

        $leaderboardMonth = $request->string('leaderboard_month')->toString();
        $leaderboardMonth = preg_match('/^\d{4}-\d{2}$/', $leaderboardMonth)
            ? $leaderboardMonth
            : Carbon::today(config('app.timezone'))->format('Y-m');

        return Inertia::render('Dashboard', [
            'boardPreviewJobs' => $user?->hasPermission('job.list.view')
                ? $boardQuery
                    ->where('status', DraftingRequest::STATUS_FOR_CHECKING)
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
            'attendance' => $this->attendance->dashboardAttendancePayload(),
            'clock' => $user
                ? $this->attendance->clockStateForUser($user)
                : null,
            'activityFormOptions' => $user?->hasPermission('dashboard.view')
                ? [
                    'activities' => [
                        ['value' => 'admin', 'label' => 'Admin'],
                        ['value' => 'meeting', 'label' => 'Meeting'],
                        ['value' => 'training', 'label' => 'Training'],
                        ['value' => 'drafting', 'label' => 'Drafting'],
                        ['value' => 'downtime', 'label' => 'Downtime'],
                    ],
                    'projects' => $user->hasPermission('job.list.view')
                        ? DraftingRequest::query()
                            ->active()
                            ->reviewAccepted()
                            ->apm()
                            ->whereIn('status', [
                                DraftingRequest::STATUS_NEW,
                                DraftingRequest::STATUS_WIP,
                                DraftingRequest::STATUS_DESIGN_WIP,
                                DraftingRequest::STATUS_DRAFTING_WIP,
                                DraftingRequest::STATUS_FOR_CHECKING,
                            ])
                            ->when(
                                ! $user->isAdmin(),
                                fn ($query) => $query->where(function ($inner) use ($user) {
                                    $inner
                                        ->where('user_id', $user->id)
                                        ->orWhereHas(
                                            'assignments',
                                            fn ($assignment) => $assignment->where('user_id', $user->id),
                                        );
                                }),
                            )
                            ->orderByDesc('requested_at')
                            ->orderByDesc('id')
                            ->limit(200)
                            ->get(['id', 'site_address', 'requested_at', 'created_at'])
                            ->map(fn ($row) => [
                                'value' => (string) $row->id,
                                'label' => trim(
                                    ($row->site_address ?: 'Untitled').' ('.$row->jobNumber().')',
                                ),
                            ])
                            ->values()
                            ->all()
                        : [],
                ]
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
            'holidays' => $this->holidays->forRange($calendarStart, $calendarEnd),
            'calendarEvents' => $this->calendarEvents->forRange($calendarStart, $calendarEnd),
            'upcomingHolidays' => $this->holidays->upcoming(),
            'upcomingBirthdays' => $this->leave->upcomingBirthdays(),
            'calendarMonth' => $month->format('Y-m'),
            'onLeaveToday' => $user
                ? $this->leave->onLeaveToday()
                : [],
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

    public function storeActivity(StoreDashboardActivityRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->timesheet->storeDashboardActivity(
            $request->user(),
            $validated['activity'],
            (int) $validated['project_id'],
            Carbon::parse($validated['date']),
            (int) $validated['hours'],
            (int) $validated['minutes'],
        );

        return back()->with('status', 'activity-logged');
    }
}
