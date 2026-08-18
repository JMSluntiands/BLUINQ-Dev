<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimesheetEntryRequest;
use App\Http\Requests\UpdateTimesheetApprovalRequest;
use App\Http\Requests\UpdateTimesheetHourRequest;
use App\Models\TimesheetEntry;
use App\Services\WeeklyTimesheetService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WeeklyTimesheetController extends Controller
{
    public function __construct(
        private WeeklyTimesheetService $timesheet,
    ) {}

    public function storeEntry(StoreTimesheetEntryRequest $request): RedirectResponse
    {
        $user = $request->user();
        $weekStart = Carbon::parse($request->validated('week_start'))->startOfWeek(Carbon::MONDAY);

        $this->timesheet->storeEntry(
            $user,
            $weekStart,
            $request->validated('task_type'),
            $request->validated('revision_id'),
        );

        return redirect()
            ->route('timesheet.index', ['week' => $weekStart->toDateString()])
            ->with('status', 'timesheet-entry-added');
    }

    public function updateHour(
        UpdateTimesheetHourRequest $request,
        TimesheetEntry $timesheetEntry,
    ): RedirectResponse {
        $user = $request->user();
        $workDate = Carbon::parse($request->validated('work_date'));

        $this->timesheet->updateHour(
            $user,
            $timesheetEntry,
            $workDate,
            (float) $request->validated('hours'),
        );

        return back();
    }

    public function updateApproval(
        UpdateTimesheetApprovalRequest $request,
        TimesheetEntry $timesheetEntry,
    ): RedirectResponse {
        $this->timesheet->updateApproval(
            $request->user(),
            $timesheetEntry,
            $request->validated('approval_status'),
        );

        return back();
    }

    public function destroyEntry(Request $request, TimesheetEntry $timesheetEntry): RedirectResponse
    {
        $this->timesheet->destroyEntry($request->user(), $timesheetEntry);

        return back()->with('status', 'timesheet-entry-removed');
    }
}
