<?php

namespace App\Http\Controllers;

use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceHistoryController extends Controller
{
    public function __construct(
        private AttendanceService $attendance,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('attendance.history.view'), 403);

        $payload = $this->attendance->historyPayload([
            'search' => $request->input('search'),
            'from' => $request->input('from'),
            'to' => $request->input('to'),
            'per_page' => $request->input('per_page'),
        ]);

        return Inertia::render('Attendance/History', $payload);
    }
}
