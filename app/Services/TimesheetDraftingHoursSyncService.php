<?php

namespace App\Services;

use App\Models\DraftingRequestRevision;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryHour;
use Carbon\Carbon;

class TimesheetDraftingHoursSyncService
{
    public function __construct(
        private DraftingRequestBoardService $board,
    ) {}

    public function syncTimesheetToRevision(DraftingRequestRevision $revision): void
    {
        $userId = $revision->drafter_user_id;
        if ($userId === null) {
            return;
        }

        $total = (float) TimesheetEntryHour::query()
            ->whereHas('entry', function ($query) use ($revision, $userId) {
                $query
                    ->where('drafting_request_revision_id', $revision->id)
                    ->where('user_id', $userId);
            })
            ->sum('hours');

        $revision->updateQuietly([
            'drafting_hours' => $total > 0 ? round($total, 2) : null,
        ]);

        $revision = $revision->fresh();
        if ($revision === null) {
            return;
        }

        $draftingRequest = $revision->draftingRequest;
        if ($draftingRequest !== null) {
            $this->board->syncRevisionHoursToAssignments($draftingRequest, $revision);
        }
    }

    public function syncRevisionToTimesheet(DraftingRequestRevision $revision): void
    {
        $userId = $revision->drafter_user_id;
        if ($userId === null) {
            return;
        }

        $draftingHours = $revision->drafting_hours;
        if ($draftingHours === null || (float) $draftingHours <= 0) {
            return;
        }

        $logDate = $revision->log_date;
        if ($logDate === null) {
            return;
        }

        $weekStart = $logDate->copy()->startOfWeek(Carbon::MONDAY);

        $entry = TimesheetEntry::query()->firstOrCreate(
            [
                'user_id' => $userId,
                'week_start' => $weekStart->toDateString(),
                'drafting_request_revision_id' => $revision->id,
            ],
            [
                'task_type' => TimesheetEntry::TASK_REVISION,
                'approval_status' => 'pending',
            ],
        );

        $entry->hours()->delete();

        TimesheetEntryHour::query()->create([
            'timesheet_entry_id' => $entry->id,
            'work_date' => $logDate->toDateString(),
            'hours' => round((float) $draftingHours, 1),
        ]);
    }
}
