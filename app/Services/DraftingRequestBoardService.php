<?php

namespace App\Services;

use App\Models\DraftingRequest;
use App\Models\DraftingRequestAssignment;
use App\Models\DraftingRequestRevision;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class DraftingRequestBoardService
{
    /**
     * @return Builder<DraftingRequest>
     */
    public function baseQuery(Request $request): Builder
    {
        $user = $request->user();

        $query = DraftingRequest::query()
            ->with([
                'buildingType:id,name',
                'serviceEngagings:id,name',
                'assignments' => fn ($relation) => $relation
                    ->with('user:id,name')
                    ->orderBy('role')
                    ->orderBy('slot'),
            ])
            ->withCount(['files', 'comments'])
            ->active()
            ->reviewAccepted()
            ->orderByDesc('is_priority')
            ->orderByDesc('requested_at')
            ->orderByDesc('id');

        if ($user !== null && ! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query;
    }

    /**
     * @param  Builder<DraftingRequest>  $query
     */
    public function applySearch(Builder $query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $query->where(function ($q) use ($search) {
            $q->where('your_name', 'like', '%'.$search.'%')
                ->orWhere('company_name', 'like', '%'.$search.'%')
                ->orWhere('email', 'like', '%'.$search.'%')
                ->orWhere('site_address', 'like', '%'.$search.'%')
                ->orWhere('site_owner_name', 'like', '%'.$search.'%');
        });
    }

    /**
     * @return array{search: string, per_page: int}
     */
    public function resolveListFilters(Request $request): array
    {
        $search = Str::limit(trim((string) $request->input('search', '')), 255);
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 5 || $perPage > 50) {
            $perPage = 10;
        }

        return [
            'search' => $search,
            'per_page' => $perPage,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function formatBoardRow(DraftingRequest $row): array
    {
        $tz = config('app.timezone');
        $services = $row->serviceEngagings->pluck('name')->values();
        $categoryFull = $services->join(', ');
        $category = $services->first() ?? '—';
        if (mb_strlen($category) > 16) {
            $category = mb_substr($category, 0, 13).'...';
        }

        $area = null;
        if ($row->max_building_area_sqm !== null && $row->max_building_area_sqm !== '') {
            $areaValue = rtrim(rtrim((string) $row->max_building_area_sqm, '0'), '.');
            $area = $areaValue.' m²';
        }

        $boardStatus = $this->mapBoardStatus($row->status);
        $drafting = $this->boardAssignmentsForRole(
            $row->assignments,
            DraftingRequestAssignment::ROLE_DRAFTING,
            $this->draftingSlotCount(),
        );
        $checking = $this->boardAssignmentsForRole(
            $row->assignments,
            DraftingRequestAssignment::ROLE_CHECKING,
            $this->checkingSlotCount(),
        );
        $totalHours = $this->sumAssignmentHours($row->assignments);

        return [
            'id' => $row->id,
            'reference' => sprintf('DRF-%05d', $row->id),
            'job' => $row->site_address ?: '—',
            'job_no' => sprintf('DRF-%05d', $row->id),
            'builder' => $row->company_name ?: ($row->your_name ?: '—'),
            'category' => $category,
            'category_full' => $categoryFull !== '' ? $categoryFull : '—',
            'house_type' => $row->buildingType?->name ?? '—',
            'date_in' => $row->requested_at?->timezone($tz)->format('M j') ?? '—',
            'eta' => '—',
            'progress_segments' => $this->buildProgressSegments($boardStatus, $drafting, $checking),
            'drafting' => $drafting,
            'checking' => $checking,
            'total_hours' => $totalHours,
            'files_count' => $row->files_count,
            'area' => $area,
            'date_out' => '—',
            'status' => $boardStatus,
            'status_label' => $this->boardStatusLabel($boardStatus, $row->statusLabel()),
            'list_group' => $this->mapJobListGroup($row),
            'is_priority' => (bool) $row->is_priority,
            'vo_hours' => null,
            'comments_count' => $row->comments_count ?? 0,
            'has_comments' => ($row->comments_count ?? 0) > 0,
        ];
    }

    /**
     * @return array{date: string, label: string, data: list<array{status: string, count: int, color: string}>}
     */
    public function jobStatusChartPayload(Request $request, ?string $date = null): array
    {
        $tz = config('app.timezone');
        $day = ($date !== null && $date !== '')
            ? Carbon::parse($date, $tz)->startOfDay()
            : Carbon::today($tz)->startOfDay();

        $query = $this->baseQuery($request)->select('status');

        $query->whereBetween('requested_at', [
            $day->copy()->utc(),
            $day->copy()->endOfDay()->utc(),
        ]);

        $counts = [
            'on_hold' => 0,
            'for_checking' => 0,
            'new' => 0,
            'wip' => 0,
        ];

        foreach ($query->pluck('status') as $status) {
            $boardStatus = $this->mapBoardStatus($status);

            if (array_key_exists($boardStatus, $counts)) {
                $counts[$boardStatus]++;
            }
        }

        return [
            'date' => $day->format('Y-m-d'),
            'label' => $day->timezone($tz)->format('M j, Y'),
            'data' => $this->formatJobStatusChartData($counts),
        ];
    }

    /**
     * @return array{
     *     month: string,
     *     label: string,
     *     data: list<array{
     *         drafter: string,
     *         da_planning: int,
     *         prestart: int,
     *         schematic_design: int,
     *         siting: int,
     *         variation: int,
     *         working_drawings: int
     *     }>
     * }
     */
    public function drafterLeaderboardPayload(Request $request, ?string $month = null): array
    {
        $tz = config('app.timezone');
        $monthStart = ($month !== null && preg_match('/^\d{4}-\d{2}$/', $month))
            ? Carbon::createFromFormat('Y-m', $month, $tz)->startOfMonth()
            : Carbon::today($tz)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $requestIds = $this->baseQuery($request)->pluck('id');
        $seriesKeys = $this->leaderboardSeriesKeys();
        $byDrafter = [];

        $requestsById = $requestIds->isEmpty()
            ? collect()
            : DraftingRequest::query()
                ->with('serviceEngagings:id,name')
                ->whereIn('id', $requestIds)
                ->get()
                ->keyBy('id');

        if ($requestIds->isNotEmpty()) {
            $revisions = DraftingRequestRevision::query()
                ->with('drafter:id,name')
                ->whereIn('drafting_request_id', $requestIds)
                ->whereBetween('log_date', [
                    $monthStart->toDateString(),
                    $monthEnd->toDateString(),
                ])
                ->orderBy('log_date')
                ->orderBy('id')
                ->get();

            foreach ($revisions as $revision) {
                $seriesKey = $this->mapCategoryToLeaderboardKey($revision->category);
                if ($seriesKey === null) {
                    continue;
                }

                $initials = $revision->drafter_initials
                    ?? $revision->drafter?->badgeInitials()
                    ?? '?';

                $this->incrementLeaderboardEntry($byDrafter, $initials, $seriesKey, $seriesKeys);
            }

            $assignments = DraftingRequestAssignment::query()
                ->with('user:id,name')
                ->whereIn('drafting_request_id', $requestIds)
                ->where('role', DraftingRequestAssignment::ROLE_DRAFTING)
                ->whereBetween('updated_at', [
                    $monthStart->copy()->utc(),
                    $monthEnd->copy()->endOfDay()->utc(),
                ])
                ->get();

            foreach ($assignments as $assignment) {
                $draftingRequest = $requestsById->get($assignment->drafting_request_id);
                if ($draftingRequest === null) {
                    continue;
                }

                $seriesKey = $this->mapRequestToLeaderboardKey($draftingRequest);
                if ($seriesKey === null) {
                    continue;
                }

                $initials = $assignment->user?->badgeInitials() ?? '?';
                $weight = $assignment->hours !== null && (float) $assignment->hours > 0
                    ? max(1, (int) round((float) $assignment->hours))
                    : 1;

                $this->incrementLeaderboardEntry(
                    $byDrafter,
                    $initials,
                    $seriesKey,
                    $seriesKeys,
                    $weight,
                );
            }
        }

        ksort($byDrafter);

        return [
            'month' => $monthStart->format('Y-m'),
            'label' => $monthStart->format('F Y'),
            'data' => array_values($byDrafter),
        ];
    }

    /**
     * @param  array<string, array<string, int|string>>  $byDrafter
     * @param  list<string>  $seriesKeys
     */
    private function incrementLeaderboardEntry(
        array &$byDrafter,
        string $initials,
        string $seriesKey,
        array $seriesKeys,
        int $weight = 1,
    ): void {
        if (! isset($byDrafter[$initials])) {
            $byDrafter[$initials] = array_fill_keys($seriesKeys, 0);
            $byDrafter[$initials]['drafter'] = $initials;
        }

        $byDrafter[$initials][$seriesKey] += $weight;
    }

    public function mapRequestToLeaderboardKey(DraftingRequest $request): ?string
    {
        foreach ($request->serviceEngagings as $service) {
            $seriesKey = $this->mapCategoryToLeaderboardKey($service->name);
            if ($seriesKey !== null) {
                return $seriesKey;
            }
        }

        return 'working_drawings';
    }

    /**
     * @return list<string>
     */
    public function leaderboardSeriesKeys(): array
    {
        return [
            'da_planning',
            'prestart',
            'schematic_design',
            'siting',
            'variation',
            'working_drawings',
        ];
    }

    public function mapCategoryToLeaderboardKey(?string $category): ?string
    {
        $normalized = mb_strtoupper(trim($category ?? ''));

        if ($normalized === '') {
            return null;
        }

        /** @var array<string, string> $keys */
        $keys = config('drafting.leaderboard_category_keys', []);

        if (isset($keys[$normalized])) {
            return $keys[$normalized];
        }

        foreach ($keys as $label => $key) {
            if (str_contains($label, $normalized) || str_contains($normalized, $label)) {
                return $key;
            }
        }

        return null;
    }

    public function draftingSlotCount(): int
    {
        return max(1, (int) config('drafting.drafting_slots', 2));
    }

    public function checkingSlotCount(): int
    {
        return max(1, (int) config('drafting.checking_slots', 2));
    }

    public function canAssignStaff(Request $request, DraftingRequest $row): bool
    {
        $user = $request->user();

        if ($user === null || $row->isArchived()) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return $row->user_id === $user->id;
    }

    /**
     * @return list<array{id: int, name: string, initials: string}>
     */
    public function assignableUsers(): array
    {
        return User::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'initials' => $user->badgeInitials(),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, DraftingRequestAssignment>  $assignments
     * @return list<array{id: int, user_id: int, initials: string, name: string, hours?: string|null}|null>
     */
    public function boardAssignmentsForRole(Collection $assignments, string $role, int $slots): array
    {
        $bySlot = [];

        foreach ($assignments as $assignment) {
            if ($assignment->role !== $role) {
                continue;
            }

            $bySlot[$assignment->slot] = $this->formatBoardAssignment($assignment);
        }

        $padded = [];
        for ($index = 0; $index < $slots; $index++) {
            $padded[] = $bySlot[$index] ?? null;
        }

        return $padded;
    }

    /**
     * @return array{id: int, user_id: int, initials: string, name: string, hours?: string|null}
     */
    public function formatBoardAssignment(DraftingRequestAssignment $assignment): array
    {
        return [
            'id' => $assignment->id,
            'user_id' => $assignment->user_id,
            'initials' => $assignment->user?->badgeInitials() ?? '?',
            'name' => $assignment->user?->name ?? '—',
            'hours' => $this->formatRevisionHours($assignment->hours),
        ];
    }

    /**
     * @param  Collection<int, DraftingRequestAssignment>  $assignments
     */
    public function sumAssignmentHours(Collection $assignments): ?string
    {
        $total = $assignments->reduce(
            static fn (float $carry, DraftingRequestAssignment $assignment) => $carry + (float) ($assignment->hours ?? 0),
            0.0,
        );

        if ($total <= 0) {
            return null;
        }

        return rtrim(rtrim(number_format($total, 2, '.', ''), '0'), '.');
    }

    public function maxSlotForRole(string $role): int
    {
        $slots = $role === DraftingRequestAssignment::ROLE_DRAFTING
            ? $this->draftingSlotCount()
            : $this->checkingSlotCount();

        return max(0, $slots - 1);
    }

    /**
     * @param  Collection<int, DraftingRequestRevision>  $revisions
     * @param  list<string>  $categories
     * @return list<array{initials: string, hours?: string|null}|null>
     */
    public function staffAssignmentsFromRevisions(Collection $revisions, array $categories, int $slots): array
    {
        $allowed = array_map(
            static fn (string $category) => mb_strtoupper(trim($category)),
            $categories,
        );
        $assignments = [];
        $seenInitials = [];

        foreach ($revisions as $revision) {
            $category = mb_strtoupper(trim($revision->category ?? ''));
            if (! in_array($category, $allowed, true)) {
                continue;
            }

            $initials = $revision->drafter_initials
                ?? $revision->drafter?->badgeInitials();
            if ($initials === null || $initials === '' || isset($seenInitials[$initials])) {
                continue;
            }

            $seenInitials[$initials] = true;
            $assignments[] = [
                'initials' => $initials,
                'hours' => $this->formatRevisionHours($revision->hours),
            ];

            if (count($assignments) >= $slots) {
                break;
            }
        }

        return $this->padStaffSlots($assignments, $slots);
    }

    /**
     * @param  Collection<int, DraftingRequestRevision>  $revisions
     */
    public function sumRevisionHours(Collection $revisions): ?string
    {
        $total = $revisions->reduce(
            static fn (float $carry, DraftingRequestRevision $revision) => $carry + (float) ($revision->hours ?? 0),
            0.0,
        );

        if ($total <= 0) {
            return null;
        }

        return rtrim(rtrim(number_format($total, 2, '.', ''), '0'), '.');
    }

    public function formatRevisionHours(mixed $hours): ?string
    {
        if ($hours === null || $hours === '') {
            return null;
        }

        $formatted = rtrim(rtrim((string) $hours, '0'), '.');

        return $formatted === '' ? null : $formatted.' h';
    }

    /**
     * @param  array<string, int>  $counts
     * @return list<array{status: string, count: int, color: string}>
     */
    public function formatJobStatusChartData(array $counts): array
    {
        return [
            [
                'status' => 'On Hold',
                'count' => $counts['on_hold'],
                'color' => '#8b5cf6',
            ],
            [
                'status' => 'For Checking',
                'count' => $counts['for_checking'],
                'color' => '#3b82f6',
            ],
            [
                'status' => 'New',
                'count' => $counts['new'],
                'color' => '#94a3b8',
            ],
            [
                'status' => 'WIP',
                'count' => $counts['wip'],
                'color' => '#f87171',
            ],
        ];
    }

    public function mapBoardStatus(?string $status): string
    {
        return match ($status) {
            DraftingRequest::STATUS_IN_PROGRESS => 'wip',
            DraftingRequest::STATUS_COMPLETED => 'for_checking',
            DraftingRequest::STATUS_ON_HOLD => 'on_hold',
            DraftingRequest::STATUS_PENDING, DraftingRequest::STATUS_ALLOCATED => 'new',
            default => 'new',
        };
    }

    public function boardStatusLabel(string $boardStatus, string $fallback): string
    {
        return match ($boardStatus) {
            'for_checking' => 'For Checking',
            'wip' => 'WIP',
            'new' => 'New',
            'on_hold' => 'On Hold',
            default => $fallback,
        };
    }

    public function mapJobListGroup(DraftingRequest $row): string
    {
        $status = $row->status ?? DraftingRequest::STATUS_ALLOCATED;

        if ($status === DraftingRequest::STATUS_COMPLETED) {
            return 'completed_projects';
        }

        if (in_array($status, [
            DraftingRequest::STATUS_PENDING,
            DraftingRequest::STATUS_ALLOCATED,
        ], true)) {
            return 'for_quotes';
        }

        if (in_array($status, [
            DraftingRequest::STATUS_IN_PROGRESS,
            DraftingRequest::STATUS_ON_HOLD,
        ], true)) {
            return $this->isDesignPhaseRequest($row) ? 'design_wip' : 'drafting_wip';
        }

        return 'for_quotes';
    }

    /**
     * @return array<string, string>
     */
    public function jobListSectionLabels(): array
    {
        /** @var array<string, string> $sections */
        $sections = config('drafting.job_list_sections', []);

        return $sections;
    }

    private function isDesignPhaseRequest(DraftingRequest $row): bool
    {
        $haystack = mb_strtolower($row->serviceEngagings->pluck('name')->join(' '));

        if ($haystack === '') {
            return false;
        }

        foreach (config('drafting.design_phase_service_keywords', []) as $keyword) {
            if (str_contains($haystack, mb_strtolower((string) $keyword))) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  list<array{initials: string, hours?: string|null}>  $assignments
     * @return list<array{initials: string, hours?: string|null}|null>
     */
    public function padStaffSlots(array $assignments, int $slots): array
    {
        $padded = [];

        for ($index = 0; $index < $slots; $index++) {
            $padded[] = $assignments[$index] ?? null;
        }

        return $padded;
    }

    /**
     * @param  list<array{initials: string, hours?: string|null}|null>  $drafting
     * @param  list<array{initials: string, hours?: string|null}|null>  $checking
     * @return list<array{color: string, weight: int}>
     */
    public function buildProgressSegments(string $boardStatus, array $drafting, array $checking): array
    {
        $palette = ['#8b5cf6', '#06b6d4', '#f472b6', '#f97316', '#22c55e', '#eab308'];
        $segments = [];

        foreach ([...$drafting, ...$checking] as $index => $assignment) {
            if ($assignment === null) {
                continue;
            }

            $segments[] = [
                'color' => $palette[$index % count($palette)],
                'weight' => 1,
            ];
        }

        if ($segments !== []) {
            return $segments;
        }

        return match ($boardStatus) {
            'for_checking' => [
                ['color' => '#06b6d4', 'weight' => 3],
                ['color' => '#8b5cf6', 'weight' => 2],
            ],
            'wip' => [
                ['color' => '#f472b6', 'weight' => 2],
                ['color' => '#f97316', 'weight' => 2],
                ['color' => '#8b5cf6', 'weight' => 1],
            ],
            'on_hold' => [
                ['color' => '#8b5cf6', 'weight' => 3],
            ],
            default => [
                ['color' => '#64748b', 'weight' => 2],
                ['color' => '#475569', 'weight' => 1],
            ],
        };
    }
}
