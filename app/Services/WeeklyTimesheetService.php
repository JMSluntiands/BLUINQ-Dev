<?php

namespace App\Services;

use App\Models\DraftingRequest;
use App\Models\DraftingRequestRevision;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryHour;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class WeeklyTimesheetService
{
    public function __construct(
        private TimesheetDraftingHoursSyncService $sync,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function payloadForUser(User $user, Carbon $weekStart): array
    {
        $weekStart = $weekStart->copy()->startOfWeek(Carbon::MONDAY);
        $weekDays = $this->weekDays($weekStart);

        $entries = TimesheetEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('week_start', $weekStart)
            ->with(['revision.draftingRequest', 'draftingRequest', 'hours'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return [
            'week_start' => $weekStart->toDateString(),
            'rows' => $entries
                ->map(fn (TimesheetEntry $entry) => $this->formatEntryRow($entry, $weekDays))
                ->values()
                ->all(),
            'available_revisions' => $this->availableRevisionsForUser($user, $weekStart, $entries),
            'standard_tasks' => TimesheetEntry::STANDARD_TASK_LABELS,
        ];
    }

    public function storeEntry(User $user, Carbon $weekStart, string $taskType, ?int $revisionId): TimesheetEntry
    {
        $weekStart = $weekStart->copy()->startOfWeek(Carbon::MONDAY);

        if ($taskType === TimesheetEntry::TASK_REVISION) {
            if ($revisionId === null) {
                throw ValidationException::withMessages([
                    'revision_id' => 'Select a revision from the APM list.',
                ]);
            }

            $revision = $this->findAvailableRevision($user, $revisionId);
            if ($revision === null) {
                throw ValidationException::withMessages([
                    'revision_id' => 'The selected revision is not available.',
                ]);
            }

            $exists = TimesheetEntry::query()
                ->where('user_id', $user->id)
                ->whereDate('week_start', $weekStart)
                ->where('drafting_request_revision_id', $revisionId)
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'revision_id' => 'This revision is already on the timesheet for this week.',
                ]);
            }

            return TimesheetEntry::query()->create([
                'user_id' => $user->id,
                'week_start' => $weekStart->toDateString(),
                'task_type' => TimesheetEntry::TASK_REVISION,
                'drafting_request_revision_id' => $revisionId,
                'drafting_request_id' => $revision->drafting_request_id,
                'sort_order' => $this->nextSortOrder($user, $weekStart),
            ]);
        }

        if (! array_key_exists($taskType, TimesheetEntry::STANDARD_TASK_LABELS)) {
            throw ValidationException::withMessages([
                'task_type' => 'Select a valid task type.',
            ]);
        }

        $exists = TimesheetEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('week_start', $weekStart)
            ->where('task_type', $taskType)
            ->whereNull('drafting_request_revision_id')
            ->whereNull('drafting_request_id')
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'task_type' => TimesheetEntry::STANDARD_TASK_LABELS[$taskType].' is already on this timesheet.',
            ]);
        }

        return TimesheetEntry::query()->create([
            'user_id' => $user->id,
            'week_start' => $weekStart->toDateString(),
            'task_type' => $taskType,
            'sort_order' => $this->nextSortOrder($user, $weekStart),
        ]);
    }

    public function storeDashboardActivity(
        User $user,
        string $activity,
        ?int $projectId,
        Carbon $workDate,
        int $hours,
        int $minutes,
    ): TimesheetEntry {
        if (! array_key_exists($activity, TimesheetEntry::ACTIVITY_TASK_LABELS)) {
            throw ValidationException::withMessages([
                'activity' => 'Select a valid activity.',
            ]);
        }

        $requiresProject = TimesheetEntry::activityRequiresProject($activity);

        if ($requiresProject) {
            if ($projectId === null) {
                throw ValidationException::withMessages([
                    'project_id' => 'Select a project.',
                ]);
            }

            $project = $this->findActivityProject($user, $projectId);
            if ($project === null) {
                throw ValidationException::withMessages([
                    'project_id' => 'The selected project is not available.',
                ]);
            }
        } else {
            $projectId = null;
        }

        $duration = max(0, min(24, round(($hours + ($minutes / 60)) * 2) / 2));
        if ($duration <= 0) {
            throw ValidationException::withMessages([
                'hours' => 'Enter a duration greater than zero.',
            ]);
        }

        $weekStart = $workDate->copy()->startOfWeek(Carbon::MONDAY);

        $entryQuery = TimesheetEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('week_start', $weekStart)
            ->where('task_type', $activity)
            ->whereNull('drafting_request_revision_id');

        if ($projectId === null) {
            $entryQuery->whereNull('drafting_request_id');
        } else {
            $entryQuery->where('drafting_request_id', $projectId);
        }

        $entry = $entryQuery->first();

        if ($entry === null) {
            $entry = TimesheetEntry::query()->create([
                'user_id' => $user->id,
                'week_start' => $weekStart->toDateString(),
                'task_type' => $activity,
                'drafting_request_id' => $projectId,
                'sort_order' => $this->nextSortOrder($user, $weekStart),
            ]);
        }

        $existingHour = TimesheetEntryHour::query()
            ->where('timesheet_entry_id', $entry->id)
            ->whereDate('work_date', $workDate)
            ->first();

        $totalHours = max(
            0,
            min(24, round((((float) ($existingHour?->hours ?? 0)) + $duration) * 2) / 2),
        );

        TimesheetEntryHour::query()->updateOrCreate(
            [
                'timesheet_entry_id' => $entry->id,
                'work_date' => $workDate->toDateString(),
            ],
            ['hours' => $totalHours],
        );

        return $entry->fresh(['hours', 'draftingRequest']);
    }

    /**
     * Clock-in / dashboard activity dropdown options.
     *
     * @return array{activities: list<array{value: string, label: string}>, projects: list<array{value: string, label: string}>}
     */
    public function activityFormOptionsForUser(User $user): array
    {
        return [
            'activities' => collect(TimesheetEntry::ACTIVITY_TASK_LABELS)
                ->map(fn (string $label, string $value) => [
                    'value' => $value,
                    'label' => $label,
                ])
                ->values()
                ->all(),
            'projects' => $this->activityProjectsForUser($user),
        ];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public function activityProjectsForUser(User $user): array
    {
        return $this->activityProjectQueryForUser($user)
            ->with('revisions:id,drafting_request_id,code,log_date')
            ->orderByDesc('requested_at')
            ->orderByDesc('id')
            ->limit(200)
            ->get(['id', 'site_address', 'requested_at', 'created_at', 'lead_number'])
            ->map(function (DraftingRequest $row) {
                $revisionCode = trim((string) ($row->revisions->first()?->code ?? ''));
                $number = $revisionCode !== '' ? $revisionCode : $row->jobNumber();

                return [
                    'value' => (string) $row->id,
                    'label' => trim(
                        ($row->site_address ?: 'Untitled').' ('.$number.')',
                    ),
                ];
            })
            ->values()
            ->all();
    }

    public function updateHour(
        User $user,
        TimesheetEntry $entry,
        Carbon $workDate,
        float $hours,
    ): void {
        $this->assertEntryOwner($user, $entry);

        $hours = max(0, min(24, round($hours * 2) / 2));

        TimesheetEntryHour::query()->updateOrCreate(
            [
                'timesheet_entry_id' => $entry->id,
                'work_date' => $workDate->toDateString(),
            ],
            ['hours' => $hours],
        );

        if ($entry->isRevisionTask() && $entry->revision !== null) {
            $this->sync->syncTimesheetToRevision($entry->revision);
        }
    }

    public function updateApproval(User $actor, TimesheetEntry $entry, string $status): void
    {
        if (! in_array($status, ['approved', 'declined', 'pending'], true)) {
            throw ValidationException::withMessages([
                'approval_status' => 'Invalid approval status.',
            ]);
        }

        $entry->update(['approval_status' => $status]);
    }

    public function destroyEntry(User $user, TimesheetEntry $entry): void
    {
        $this->assertEntryOwner($user, $entry);

        $revision = $entry->revision;
        $entry->delete();

        if ($revision !== null) {
            $this->sync->syncTimesheetToRevision($revision);
        }
    }

    /**
     * @return list<Carbon>
     */
    private function weekDays(Carbon $weekStart): array
    {
        return collect(range(0, 6))
            ->map(fn (int $offset) => $weekStart->copy()->addDays($offset))
            ->all();
    }

    /**
     * @param  list<Carbon>  $weekDays
     * @return array<string, mixed>
     */
    private function formatEntryRow(TimesheetEntry $entry, array $weekDays): array
    {
        $hoursByDate = $entry->hours->keyBy(
            fn (TimesheetEntryHour $hour) => $hour->work_date->toDateString(),
        );

        $hours = collect($weekDays)
            ->map(fn (Carbon $day) => (float) ($hoursByDate[$day->toDateString()]->hours ?? 0))
            ->all();

        $revision = $entry->revision;
        $project = $entry->draftingRequest;
        $isProjectActivity = $entry->isProjectActivity();
        $jobId = $entry->drafting_request_id
            ?? $revision?->drafting_request_id;

        $taskLabel = $isProjectActivity
            ? (string) ($project?->jobNumber() ?? 'Project')
            : $this->taskLabel($entry);

        $activityLabel = $isProjectActivity
            ? (TimesheetEntry::ACTIVITY_TASK_LABELS[$entry->task_type] ?? ucfirst($entry->task_type))
            : null;

        return [
            'id' => $entry->id,
            'task_type' => $entry->task_type,
            'task_label' => $taskLabel,
            'activity_label' => $activityLabel,
            'revision_id' => $entry->drafting_request_revision_id,
            'job_id' => $jobId,
            'hours' => $hours,
            'approval' => $entry->approval_status,
            'is_linked' => $entry->isRevisionTask(),
            'is_project_activity' => $isProjectActivity,
        ];
    }

    private function taskLabel(TimesheetEntry $entry): string
    {
        if ($entry->isRevisionTask()) {
            return (string) ($entry->revision?->code ?? 'Revision');
        }

        return TimesheetEntry::STANDARD_TASK_LABELS[$entry->task_type]
            ?? TimesheetEntry::ACTIVITY_TASK_LABELS[$entry->task_type]
            ?? ucfirst($entry->task_type);
    }

    /**
     * @return list<string>
     */
    private function activityProjectStatuses(): array
    {
        return [
            DraftingRequest::STATUS_NEW,
            DraftingRequest::STATUS_WIP,
            DraftingRequest::STATUS_ASSIGNED,
            DraftingRequest::STATUS_DESIGN_WIP,
            DraftingRequest::STATUS_DRAFTING_WIP,
            DraftingRequest::STATUS_FOR_CHECKING,
            DraftingRequest::STATUS_ON_HOLD,
            DraftingRequest::STATUS_QUERY,
        ];
    }

    private function canSeeAllActivityProjects(User $user): bool
    {
        return $user->isAdmin() || $user->role?->slug === 'project-manager';
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<DraftingRequest>
     */
    private function activityProjectQueryForUser(User $user)
    {
        return DraftingRequest::query()
            ->active()
            ->reviewAccepted()
            ->apm()
            ->whereIn('status', $this->activityProjectStatuses())
            ->when(
                ! $this->canSeeAllActivityProjects($user),
                fn ($query) => $query->where(function ($inner) use ($user) {
                    $inner
                        ->where('user_id', $user->id)
                        ->orWhereHas(
                            'assignments',
                            fn ($assignment) => $assignment->where('user_id', $user->id),
                        )
                        ->orWhereHas(
                            'revisions',
                            fn ($revision) => $revision
                                ->where('drafter_user_id', $user->id)
                                ->orWhere('checker_user_id', $user->id),
                        );
                }),
            );
    }

    private function findActivityProject(User $user, int $projectId): ?DraftingRequest
    {
        return $this->activityProjectQueryForUser($user)
            ->whereKey($projectId)
            ->first();
    }

    /**
     * @param  Collection<int, TimesheetEntry>  $currentEntries
     * @return list<array<string, mixed>>
     */
    private function availableRevisionsForUser(
        User $user,
        Carbon $weekStart,
        Collection $currentEntries,
    ): array {
        $usedRevisionIds = $currentEntries
            ->pluck('drafting_request_revision_id')
            ->filter()
            ->all();

        return $this->revisionQueryForUser($user)
            ->when($usedRevisionIds !== [], fn ($query) => $query->whereNotIn('id', $usedRevisionIds))
            ->limit(100)
            ->get()
            ->map(fn (DraftingRequestRevision $revision) => [
                'id' => $revision->id,
                'code' => $revision->code,
                'job_id' => $revision->drafting_request_id,
                'job_number' => $revision->draftingRequest?->jobNumber(),
                'log_date' => $revision->log_date?->format('M Y'),
            ])
            ->values()
            ->all();
    }

    private function revisionQueryForUser(User $user)
    {
        return DraftingRequestRevision::query()
            ->with('draftingRequest')
            ->whereHas('draftingRequest', fn ($query) => $query->active())
            ->where(function ($query) use ($user) {
                $query
                    ->where('drafter_user_id', $user->id)
                    ->orWhereHas(
                        'draftingRequest.assignments',
                        fn ($assignment) => $assignment->where('user_id', $user->id),
                    );
            })
            ->orderByDesc('log_date')
            ->orderByDesc('id');
    }

    private function findAvailableRevision(User $user, int $revisionId): ?DraftingRequestRevision
    {
        return $this->revisionQueryForUser($user)
            ->whereKey($revisionId)
            ->first();
    }

    private function nextSortOrder(User $user, Carbon $weekStart): int
    {
        $max = TimesheetEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('week_start', $weekStart)
            ->max('sort_order');

        return (int) $max + 1;
    }

    private function assertEntryOwner(User $user, TimesheetEntry $entry): void
    {
        if ($entry->user_id !== $user->id) {
            abort(403);
        }
    }
}
