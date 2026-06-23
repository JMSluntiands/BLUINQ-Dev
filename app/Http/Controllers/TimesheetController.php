<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\LeaveService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimesheetController extends Controller
{
    public function __construct(
        private LeaveService $leave,
    ) {}

    public function index(Request $request): Response
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
            'leaveCalendar' => $this->leave->calendarPayload($calendarStart, $calendarEnd),
            'calendarMonth' => $month->format('Y-m'),
            'teamMembers' => $teamMembers,
            'filters' => [
                'user_id' => $userId,
            ],
        ]);
    }
}
