<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\LeaveService;
use App\Services\WeeklyTimesheetService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimesheetController extends Controller
{
    public function __construct(
        private LeaveService $leave,
        private WeeklyTimesheetService $weeklyTimesheet,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->canViewTeamTimesheet()) {
            return $this->teamTimesheet($request);
        }

        return $this->personalTimesheet($request, $user);
    }

    private function teamTimesheet(Request $request): Response
    {
        $calendarMonth = $request->string('calendar_month')->toString();
        $month = preg_match('/^\d{4}-\d{2}$/', $calendarMonth)
            ? Carbon::createFromFormat('Y-m', $calendarMonth)->startOfMonth()
            : Carbon::today()->startOfMonth();

        [$calendarStart, $calendarEnd] = $this->leave->monthGridRange($month);

        $userId = $request->input('user_id', 'all');
        if ($userId !== 'all') {
            $userId = is_numeric($userId) ? (int) $userId : 'all';
        }

        $teamMembers = User::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values()
            ->all();

        return Inertia::render('Timesheet/Index', [
            'mode' => 'team',
            'leaveCalendar' => $this->leave->calendarPayload($calendarStart, $calendarEnd),
            'calendarMonth' => $month->format('Y-m'),
            'teamMembers' => $teamMembers,
            'filters' => [
                'user_id' => $userId,
            ],
            'weeklyTimesheet' => null,
            'canApproveTimesheet' => false,
        ]);
    }

    private function personalTimesheet(Request $request, User $user): Response
    {
        $calendarMonth = $request->string('calendar_month')->toString();
        $month = preg_match('/^\d{4}-\d{2}$/', $calendarMonth)
            ? Carbon::createFromFormat('Y-m', $calendarMonth)->startOfMonth()
            : Carbon::today()->startOfMonth();

        [$calendarStart, $calendarEnd] = $this->leave->monthGridRange($month);

        $weekParam = $request->string('week')->toString();
        $weekStart = preg_match('/^\d{4}-\d{2}-\d{2}$/', $weekParam)
            ? Carbon::parse($weekParam)->startOfWeek(Carbon::MONDAY)
            : Carbon::today()->startOfWeek(Carbon::MONDAY);

        $connectedToDrafting = $user->isConnectedToDrafting();

        $leaveCalendar = collect($this->leave->calendarPayload($calendarStart, $calendarEnd))
            ->filter(fn (array $row) => $row['id'] === $user->id)
            ->values()
            ->all();

        return Inertia::render('Timesheet/Index', [
            'mode' => $connectedToDrafting ? 'weekly' : 'personal',
            'leaveCalendar' => $leaveCalendar,
            'calendarMonth' => $month->format('Y-m'),
            'teamMembers' => [],
            'filters' => [
                'user_id' => $user->id,
            ],
            'weeklyTimesheet' => $connectedToDrafting
                ? $this->weeklyTimesheet->payloadForUser($user, $weekStart)
                : null,
            'canApproveTimesheet' => false,
        ]);
    }
}
