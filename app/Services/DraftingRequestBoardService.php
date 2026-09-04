<?php

namespace App\Services;

use App\Models\CrmCategory;
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
    public function baseQuery(Request $request, string $board = 'apm'): Builder
    {
        $query = DraftingRequest::query()
            ->with([
                'crmCategory:id,name,code',
                'crmCategories:id,name,code',
                'buildingType:id,name',
                'storeyLevel:id,name,code',
                'serviceEngagings:id,name',
                'assignments' => fn ($relation) => $relation
                    ->with('user:id,name,initials')
                    ->orderBy('role')
                    ->orderBy('slot'),
                'revisions' => fn ($relation) => $relation
                    ->with(['drafter:id,name,initials', 'checker:id,name,initials'])
                    ->orderByDesc('log_date')
                    ->orderByDesc('id'),
            ])
            ->withCount(['files', 'comments'])
            ->active()
            ->reviewAccepted()
            ->whereHas('revisions');

        $this->applyBoardStageFilter($query, $board);

        return $query;
    }

    /**
     * @return list<string>
     */
    public static function boardSortColumns(): array
    {
        return [
            'site_address',
            'revision_code',
            'company_name',
            'requested_at',
            'is_priority',
        ];
    }

    /**
     * @param  Builder<DraftingRequest>  $query
     */
    public function applyBoardSort(Builder $query, string $sort, string $direction): void
    {
        $direction = $direction === 'asc' ? 'asc' : 'desc';

        if ($sort === '' || ! in_array($sort, self::boardSortColumns(), true)) {
            $query->orderByDesc('is_priority')
                ->orderByDesc('requested_at')
                ->orderByDesc('id');

            return;
        }

        if ($sort === 'revision_code') {
            $query->orderBy(
                DraftingRequestRevision::query()
                    ->select('code')
                    ->whereColumn('drafting_request_id', 'drafting_requests.id')
                    ->orderByDesc('id')
                    ->limit(1),
                $direction,
            )->orderBy('id', $direction);

            return;
        }

        if ($sort === 'company_name') {
            $query->orderByRaw(
                "COALESCE(NULLIF(TRIM(company_name), ''), NULLIF(TRIM(your_name), ''), '') {$direction}",
            )->orderBy('id', $direction);

            return;
        }

        $query->orderBy($sort, $direction)->orderBy('id', $direction);
    }

    /**
     * @param  Builder<DraftingRequest>  $query
     */
    public function applyBoardStageFilter(Builder $query, string $board): void
    {
        if ($board === 'design') {
            $query->where(function (Builder $outer) {
                $outer->where('workflow_stage', DraftingRequest::STAGE_DESIGN)
                    ->orWhere(function (Builder $legacy) {
                        $legacy->where('workflow_stage', DraftingRequest::STAGE_APM);
                        $this->applyDesignPhaseFilter($legacy);
                    });
            });

            return;
        }

        $query->where('workflow_stage', DraftingRequest::STAGE_APM);
        $this->applyExcludeDesignPhaseFilter($query);
    }

    /**
     * Jobs that belong to either the APM or Design board.
     *
     * @param  Builder<DraftingRequest>  $query
     */
    public function applyEitherProjectBoardFilter(Builder $query): void
    {
        $query->where(function (Builder $outer) {
            $outer->where(function (Builder $apm) {
                $apm->where('workflow_stage', DraftingRequest::STAGE_APM);
                $this->applyExcludeDesignPhaseFilter($apm);
            })->orWhere(function (Builder $design) {
                $design->where('workflow_stage', DraftingRequest::STAGE_DESIGN)
                    ->orWhere(function (Builder $legacy) {
                        $legacy->where('workflow_stage', DraftingRequest::STAGE_APM);
                        $this->applyDesignPhaseFilter($legacy);
                    });
            });
        });
    }

    /**
     * Add item label source: apm vs design board the job belongs to.
     */
    public function addItemSourceFor(DraftingRequest $row): string
    {
        if ($row->workflow_stage === DraftingRequest::STAGE_DESIGN) {
            return 'design';
        }

        if ($row->workflow_stage === DraftingRequest::STAGE_APM && $this->isDesignPhaseRequest($row)) {
            return 'design';
        }

        return 'apm';
    }

    /**
     * @param  Builder<DraftingRequest>  $query
     */
    public function applySearch(Builder $query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $digits = preg_replace('/\D+/', '', $search) ?? '';
        $statusKeys = collect(DraftingRequest::statusLabels())
            ->filter(fn (string $label, string $value) =>
                str_contains(mb_strtolower($label), mb_strtolower($search))
                || str_contains(mb_strtolower($value), mb_strtolower($search))
            )
            ->keys()
            ->all();

        $query->where(function ($q) use ($search, $digits, $statusKeys) {
            $q->where('your_name', 'like', '%'.$search.'%')
                ->orWhere('company_name', 'like', '%'.$search.'%')
                ->orWhere('email', 'like', '%'.$search.'%')
                ->orWhere('phone', 'like', '%'.$search.'%')
                ->orWhere('site_address', 'like', '%'.$search.'%')
                ->orWhere('site_owner_name', 'like', '%'.$search.'%')
                ->orWhere('lead_number', 'like', '%'.$search.'%')
                ->orWhere('council_shire', 'like', '%'.$search.'%');

            if ($digits !== '') {
                $q->orWhere('lead_number', 'like', '%'.$digits.'%')
                    ->orWhere('phone', 'like', '%'.$digits.'%');

                if (ctype_digit($digits)) {
                    $q->orWhere('id', (int) $digits);
                }
            }

            if ($statusKeys !== []) {
                $q->orWhereIn('status', $statusKeys);
            }

            $q->orWhereHas('client', function ($clientQuery) use ($search) {
                $clientQuery->where('name', 'like', '%'.$search.'%');
            });

            $q->orWhereHas('storeyLevel', function ($storeyQuery) use ($search) {
                $storeyQuery->where('name', 'like', '%'.$search.'%')
                    ->orWhere('code', 'like', '%'.$search.'%');
            });

            $q->orWhereHas('revisions', function ($revisionQuery) use ($search) {
                $revisionQuery->where('code', 'like', '%'.$search.'%')
                    ->orWhere('drafter_initials', 'like', '%'.$search.'%')
                    ->orWhere('checker_initials', 'like', '%'.$search.'%')
                    ->orWhereHas('drafter', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', '%'.$search.'%')
                            ->orWhere('initials', 'like', '%'.$search.'%');
                    })
                    ->orWhereHas('checker', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', '%'.$search.'%')
                            ->orWhere('initials', 'like', '%'.$search.'%');
                    });
            });

            $q->orWhereHas('assignments.user', function ($userQuery) use ($search) {
                $userQuery->where('name', 'like', '%'.$search.'%')
                    ->orWhere('initials', 'like', '%'.$search.'%');
            });
        });
    }

    /**
     * Limit a board query to design-phase requests.
     *
     * @param  Builder<DraftingRequest>  $query
     */
    public function applyDesignPhaseFilter(Builder $query): void
    {
        $this->constrainByDesignPhase($query, include: true);
    }

    /**
     * Hide design-phase requests from the APM board.
     *
     * @param  Builder<DraftingRequest>  $query
     */
    public function applyExcludeDesignPhaseFilter(Builder $query): void
    {
        $this->constrainByDesignPhase($query, include: false);
    }

    /**
     * @param  Builder<DraftingRequest>  $query
     */
    private function constrainByDesignPhase(Builder $query, bool $include): void
    {
        $keywords = array_values(array_filter(
            array_map(
                static fn (mixed $keyword) => trim((string) $keyword),
                config('drafting.design_phase_service_keywords', []),
            ),
            static fn (string $keyword) => $keyword !== '',
        ));

        if ($keywords === []) {
            if ($include) {
                $query->whereRaw('1 = 0');
            }

            return;
        }

        $method = $include ? 'whereHas' : 'whereDoesntHave';

        $query->{$method}('serviceEngagings', function (Builder $serviceQuery) use ($keywords) {
            $serviceQuery->where(function (Builder $nameQuery) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $nameQuery->orWhere('name', 'like', '%'.$keyword.'%');
                }
            });
        });
    }

    /**
     * @return array{search: string, per_page: int, sort: string, direction: string}
     */
    public function resolveListFilters(Request $request): array
    {
        $search = Str::limit(trim((string) $request->input('search', '')), 255);
        $perPage = (int) $request->input('per_page', 50);
        if ($perPage < 5 || $perPage > 50) {
            $perPage = 50;
        }

        $sort = (string) $request->input('sort', '');
        if ($sort !== '' && ! in_array($sort, self::boardSortColumns(), true)) {
            $sort = '';
        }

        $direction = strtolower((string) $request->input('direction', 'asc'));
        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'asc';
        }

        return [
            'search' => $search,
            'per_page' => $perPage,
            'sort' => $sort,
            'direction' => $direction,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function formatBoardRow(DraftingRequest $row): array
    {
        $tz = config('app.timezone');
        $row->loadMissing(['crmCategories', 'crmCategory', 'serviceEngagings']);

        $latestRevisionCategory = $row->relationLoaded('revisions')
            ? trim((string) ($row->revisions->first()?->category ?? ''))
            : '';

        if ($latestRevisionCategory !== '') {
            $matched = $row->crmCategories->first(
                fn ($category) => $category->code === $latestRevisionCategory
                    || $category->name === $latestRevisionCategory,
            ) ?? $row->crmCategory;

            if (
                $matched === null
                || (
                    $matched->code !== $latestRevisionCategory
                    && $matched->name !== $latestRevisionCategory
                )
            ) {
                $matched = CrmCategory::query()
                    ->where(function ($query) use ($latestRevisionCategory) {
                        $query->where('code', $latestRevisionCategory)
                            ->orWhere('name', $latestRevisionCategory);
                    })
                    ->first();
            }

            $categoryFull = $matched
                ? ($matched->code && $matched->name && $matched->code !== $matched->name
                    ? "{$matched->code} — {$matched->name}"
                    : ($matched->name ?: $matched->code))
                : $latestRevisionCategory;
            $category = $matched
                ? ($matched->name ?: ($matched->code ?: $latestRevisionCategory))
                : $latestRevisionCategory;
        } elseif ($row->crmCategories->isNotEmpty()) {
            $labels = $row->crmCategories->map(
                fn ($category) => $category->code
                    ? "{$category->code} — {$category->name}"
                    : $category->name,
            )->values();
            $shorts = $row->crmCategories->map(
                fn ($category) => $category->name ?: ($category->code ?: $category->name),
            )->values();
            $categoryFull = $labels->join(', ');
            $category = $shorts->join(', ');
        } elseif ($row->crmCategory) {
            $categoryFull = $row->crmCategory->code
                ? "{$row->crmCategory->code} — {$row->crmCategory->name}"
                : $row->crmCategory->name;
            $category = $row->crmCategory->name
                ?: ($row->crmCategory->code ?: $row->crmCategory->name);
        } else {
            $services = $row->serviceEngagings->pluck('name')->values();
            $categoryFull = $services->join(', ');
            $category = $services->first() ?? '—';
        }
        if (mb_strlen($category) > 28) {
            $category = mb_substr($category, 0, 25).'...';
        }

        $area = null;
        if ($row->max_building_area_sqm !== null && $row->max_building_area_sqm !== '') {
            $areaValue = rtrim(rtrim((string) $row->max_building_area_sqm, '0'), '.');
            $area = $areaValue.' m²';
        }

        $actualStatus = $row->status ?? DraftingRequest::STATUS_NEW;
        $boardStatus = $this->mapBoardStatus($actualStatus);
        $draftingSlots = $this->draftingSlotCount();
        $checkingSlots = $this->checkingSlotCount();
        $drafting = $this->mergeStaffBoardSlots(
            $this->boardAssignmentsForRole(
                $row->assignments,
                DraftingRequestAssignment::ROLE_DRAFTING,
                $draftingSlots,
            ),
            $this->staffSlotsFromRevisionHours(
                $row->revisions,
                'drafting_hours',
                $draftingSlots,
            ),
        );
        $checking = $this->mergeStaffBoardSlots(
            $this->boardAssignmentsForRole(
                $row->assignments,
                DraftingRequestAssignment::ROLE_CHECKING,
                $checkingSlots,
            ),
            $this->staffSlotsFromRevisionHours(
                $row->revisions,
                'checking_hours',
                $checkingSlots,
            ),
        );
        $totalHours = $this->sumRevisionHours($row->revisions)
            ?? $this->sumAssignmentHours($row->assignments);

        $statusOptions = DraftingRequest::statusLabels();
        $revisions = $row->revisions
            ->sortBy('id')
            ->values()
            ->map(function ($revision) use ($statusOptions) {
                $status = $revision->status;

                return [
                    'id' => $revision->id,
                    'code' => $revision->code ?: '—',
                    'status' => $status,
                    'status_label' => $status !== null && $status !== ''
                        ? ($statusOptions[$status] ?? ucfirst(str_replace('_', ' ', $status)))
                        : null,
                ];
            })
            ->all();

        // REVISION NO. must match a real revision row — never invent "-01".
        $realCodes = collect($revisions)
            ->pluck('code')
            ->map(fn ($code) => trim((string) $code))
            ->reject(fn ($code) => $code === '' || $code === '—')
            ->values();

        $latestRevision = $row->latestRevisionCode();
        if ($latestRevision !== null && ! $realCodes->containsStrict($latestRevision)) {
            $latestRevision = $realCodes->last();
        }
        if ($latestRevision === null || $latestRevision === '') {
            $latestRevision = $realCodes->last();
        }

        $accounting = $row->relationLoaded('accountEntries')
            ? $row->accountEntries->first()?->status
            : null;

        return [
            'id' => $row->id,
            'reference' => $row->jobNumber(),
            'job' => $row->site_address ?: '—',
            'job_no' => $row->jobNumber(),
            'builder' => $row->company_name ?: ($row->your_name ?: '—'),
            'category' => $category,
            'category_full' => $categoryFull !== '' ? $categoryFull : '—',
            'storey_level' => $row->storeyLevel?->name ?? '—',
            'latest_revision' => $latestRevision ?: '—',
            'accounting' => $accounting ?: '—',
            'revisions' => $revisions,
            'date_in' => $row->requested_at?->timezone($tz)->format('Y-m-d'),
            'date_in_label' => $row->requested_at?->timezone($tz)->format('M j') ?? '—',
            'eta' => $row->eta?->format('Y-m-d'),
            'eta_label' => $row->eta?->format('M j') ?? '—',
            'start_date' => $row->start_date?->format('Y-m-d'),
            'start_date_label' => $row->start_date?->format('M j') ?? '—',
            'progress_segments' => $this->buildProgressSegments($boardStatus, $drafting, $checking),
            'drafting' => $drafting,
            'checking' => $checking,
            'total_hours' => $totalHours,
            'files_count' => $row->files_count,
            'area' => $area,
            'area_sqm' => $row->max_building_area_sqm !== null
                ? rtrim(rtrim((string) $row->max_building_area_sqm, '0'), '.')
                : null,
            'date_out' => $row->date_out?->toDateString(),
            'date_out_label' => $row->date_out
                ? Carbon::parse($row->date_out->toDateString(), $tz)->format('M j')
                : '—',
            'status' => $actualStatus,
            'status_label' => $row->statusLabel(),
            'list_group' => $this->mapJobListGroup($row),
            'is_priority' => (bool) $row->is_priority,
            'vo_hours' => $row->vo_hours !== null
                ? rtrim(rtrim((string) $row->vo_hours, '0'), '.')
                : null,
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
            'new' => 0,
            'assigned' => 0,
            'design_wip' => 0,
            'drafting_wip' => 0,
            'for_checking' => 0,
            'query' => 0,
            'submitted' => 0,
            'on_hold' => 0,
            'cancelled' => 0,
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
                ->with(['drafter:id,name,initials', 'checker:id,name,initials'])
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

                $initials = $revision->resolvedDrafterInitials() ?? '?';

                $this->incrementLeaderboardEntry($byDrafter, $initials, $seriesKey, $seriesKeys);
            }

            $assignments = DraftingRequestAssignment::query()
                ->with('user:id,name,initials')
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

        return $user->hasPermission('job.list.edit');
    }

    /**
     * @return list<array{id: int, name: string, initials: string}>
     */
    public function assignableUsers(): array
    {
        return User::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'initials'])
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
     * @param  list<array<string, mixed>|null>  $assignments
     * @param  list<array<string, mixed>|null>  $fromRevisions
     * @return list<array<string, mixed>|null>
     */
    public function mergeStaffBoardSlots(array $assignments, array $fromRevisions): array
    {
        $slotCount = max(count($assignments), count($fromRevisions));
        $merged = [];

        for ($index = 0; $index < $slotCount; $index++) {
            $assignment = $assignments[$index] ?? null;
            $revisionSlot = $fromRevisions[$index] ?? null;

            if ($assignment !== null) {
                if (($assignment['hours'] ?? null) === null
                    && $revisionSlot !== null
                    && (int) ($assignment['user_id'] ?? 0) === (int) ($revisionSlot['user_id'] ?? 0)) {
                    $assignment['hours'] = $revisionSlot['hours'];
                }

                $merged[$index] = $assignment;

                continue;
            }

            $merged[$index] = $revisionSlot;
        }

        return $merged;
    }

    /**
     * @param  Collection<int, DraftingRequestRevision>  $revisions
     * @return list<array{user_id: int, initials: string, name?: string|null, hours?: string|null}|null>
     */
    public function staffSlotsFromRevisionHours(
        Collection $revisions,
        string $hoursColumn,
        int $slots,
    ): array {
        if (! in_array($hoursColumn, ['drafting_hours', 'checking_hours'], true)) {
            return $this->padStaffSlots([], $slots);
        }

        /** @var array<int, array{user_id: int, initials: string, name: string|null, hours: float}> $byUser */
        $byUser = [];

        foreach ($revisions as $revision) {
            $hours = $revision->{$hoursColumn};
            if ($hours === null || (float) $hours <= 0) {
                continue;
            }

            $useChecker = $hoursColumn === 'checking_hours' && $revision->checker_user_id !== null;
            $userId = $useChecker ? $revision->checker_user_id : $revision->drafter_user_id;
            if ($userId === null) {
                continue;
            }

            if (! isset($byUser[$userId])) {
                $byUser[$userId] = [
                    'user_id' => $userId,
                    'initials' => $useChecker
                        ? ($revision->resolvedCheckerInitials() ?? '?')
                        : ($revision->resolvedDrafterInitials() ?? '?'),
                    'name' => $useChecker
                        ? $revision->checker?->name
                        : $revision->drafter?->name,
                    'hours' => 0.0,
                ];
            }

            $byUser[$userId]['hours'] += (float) $hours;
        }

        $assignments = [];
        foreach ($byUser as $entry) {
            $assignments[] = [
                'user_id' => $entry['user_id'],
                'initials' => $entry['initials'],
                'name' => $entry['name'],
                'hours' => $this->formatRevisionHours($entry['hours']),
            ];
        }

        return $this->padStaffSlots($assignments, $slots);
    }

    public function syncRevisionHoursToAssignments(
        DraftingRequest $draftingRequest,
        DraftingRequestRevision $revision,
    ): void {
        if (
            $revision->drafter_user_id !== null
            && $revision->drafting_hours !== null
            && (float) $revision->drafting_hours > 0
        ) {
            $this->upsertAssignmentForRole(
                $draftingRequest,
                DraftingRequestAssignment::ROLE_DRAFTING,
                $revision->drafter_user_id,
                $revision->drafting_hours,
            );
        }

        $checkerUserId = $revision->checker_user_id ?? $revision->drafter_user_id;
        if (
            $checkerUserId !== null
            && $revision->checking_hours !== null
            && (float) $revision->checking_hours > 0
        ) {
            $this->upsertAssignmentForRole(
                $draftingRequest,
                DraftingRequestAssignment::ROLE_CHECKING,
                $checkerUserId,
                $revision->checking_hours,
            );
        }
    }

    public function syncAssignmentToRevision(
        DraftingRequest $draftingRequest,
        string $role,
        int $slot,
        ?int $userId,
        mixed $hours,
    ): void {
        if ($slot !== 0) {
            if ($userId === null) {
                return;
            }

            $this->syncHoursOntoMatchingRevision($draftingRequest, $role, $userId, $hours);

            return;
        }

        $revision = $this->latestRevisionFor($draftingRequest);

        if ($revision === null) {
            if ($userId === null) {
                return;
            }

            $revision = $this->ensurePrimaryRevision($draftingRequest);
        }

        $user = $userId !== null
            ? User::query()->active()->find($userId)
            : null;

        if ($role === DraftingRequestAssignment::ROLE_CHECKING) {
            $revision->update([
                'checker_user_id' => $user?->id,
                'checker_initials' => $user?->badgeInitials(),
                'checking_hours' => $hours !== null && $hours !== '' ? $hours : null,
            ]);

            return;
        }

        $revision->update([
            'drafter_user_id' => $user?->id,
            'drafter_initials' => $user?->badgeInitials(),
            'drafting_hours' => $hours !== null && $hours !== '' ? $hours : null,
        ]);
    }

    /** @deprecated Use syncAssignmentToRevision */
    public function syncAssignmentHoursToRevision(
        DraftingRequest $draftingRequest,
        string $role,
        int $userId,
        mixed $hours,
    ): void {
        $this->syncAssignmentToRevision($draftingRequest, $role, 0, $userId, $hours);
    }

    public function syncBoardStatusToLatestRevision(
        DraftingRequest $draftingRequest,
        string $status,
    ): void {
        $revision = $this->latestRevisionFor($draftingRequest);
        if ($revision === null) {
            return;
        }

        $revision->update(['status' => $status]);
    }

    private function latestRevisionFor(DraftingRequest $draftingRequest): ?DraftingRequestRevision
    {
        return DraftingRequestRevision::query()
            ->where('drafting_request_id', $draftingRequest->id)
            ->orderByDesc('log_date')
            ->orderByDesc('id')
            ->first();
    }

    private function ensurePrimaryRevision(
        DraftingRequest $draftingRequest,
    ): DraftingRequestRevision {
        $draftingRequest->loadMissing(['crmCategories', 'crmCategory', 'serviceEngagings']);

        $fromMany = $draftingRequest->crmCategories
            ->map(fn ($category) => $category->code ?: $category->name)
            ->filter()
            ->values();

        $category = $fromMany->isNotEmpty()
            ? $fromMany->join(', ')
            : ($draftingRequest->crmCategory?->code
                ?: $draftingRequest->crmCategory?->name
                ?: $draftingRequest->serviceEngagings->sortBy('name')->first()?->name
                ?: 'Working Drawings');

        return DraftingRequestRevision::query()->create([
            'drafting_request_id' => $draftingRequest->id,
            'user_id' => $draftingRequest->user_id,
            'code' => $draftingRequest->jobNumber().'-01',
            'log_date' => now(config('app.timezone'))->toDateString(),
            'category' => $category,
            'status' => $draftingRequest->status ?? DraftingRequest::STATUS_NEW,
        ]);
    }

    private function syncHoursOntoMatchingRevision(
        DraftingRequest $draftingRequest,
        string $role,
        int $userId,
        mixed $hours,
    ): void {
        $column = $role === DraftingRequestAssignment::ROLE_CHECKING
            ? 'checking_hours'
            : 'drafting_hours';
        $userColumn = $role === DraftingRequestAssignment::ROLE_CHECKING
            ? 'checker_user_id'
            : 'drafter_user_id';

        $revision = DraftingRequestRevision::query()
            ->where('drafting_request_id', $draftingRequest->id)
            ->where($userColumn, $userId)
            ->orderByDesc('log_date')
            ->orderByDesc('id')
            ->first();

        if ($revision === null) {
            return;
        }

        $revision->update([
            $column => $hours !== null && $hours !== '' ? $hours : null,
        ]);
    }

    private function upsertAssignmentForRole(
        DraftingRequest $draftingRequest,
        string $role,
        int $userId,
        mixed $hours,
    ): void {
        $existing = DraftingRequestAssignment::query()
            ->where('drafting_request_id', $draftingRequest->id)
            ->where('role', $role)
            ->where('user_id', $userId)
            ->first();

        if ($existing !== null) {
            $existing->update(['hours' => $hours]);

            return;
        }

        $usedSlots = DraftingRequestAssignment::query()
            ->where('drafting_request_id', $draftingRequest->id)
            ->where('role', $role)
            ->pluck('slot')
            ->map(fn ($slot) => (int) $slot)
            ->all();

        $slot = 0;
        while (in_array($slot, $usedSlots, true) && $slot <= $this->maxSlotForRole($role)) {
            $slot++;
        }

        if ($slot > $this->maxSlotForRole($role)) {
            $slot = 0;
        }

        DraftingRequestAssignment::query()->updateOrCreate(
            [
                'drafting_request_id' => $draftingRequest->id,
                'role' => $role,
                'slot' => $slot,
            ],
            [
                'user_id' => $userId,
                'hours' => $hours,
            ],
        );
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

            $initials = $revision->resolvedDrafterInitials();
            if ($initials === null || $initials === '' || isset($seenInitials[$initials])) {
                continue;
            }

            $seenInitials[$initials] = true;
            $assignments[] = [
                'initials' => $initials,
                'hours' => $this->formatRevisionHours(
                    $this->revisionHoursTotal($revision) ?: null,
                ),
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
            fn (float $carry, DraftingRequestRevision $revision) => $carry + $this->revisionHoursTotal($revision),
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

    public function revisionHoursTotal(DraftingRequestRevision $revision): float
    {
        return (float) ($revision->drafting_hours ?? 0)
            + (float) ($revision->checking_hours ?? 0);
    }

    /**
     * @param  array<string, int>  $counts
     * @return list<array{status: string, count: int, color: string}>
     */
    public function formatJobStatusChartData(array $counts): array
    {
        return [
            [
                'status' => 'New',
                'count' => $counts['new'] ?? 0,
                'color' => '#94a3b8',
            ],
            [
                'status' => 'Assigned',
                'count' => $counts['assigned'] ?? 0,
                'color' => '#2563eb',
            ],
            [
                'status' => 'Design WIP',
                'count' => $counts['design_wip'] ?? 0,
                'color' => '#c026d3',
            ],
            [
                'status' => 'Work In Progress',
                'count' => $counts['drafting_wip'] ?? 0,
                'color' => '#f87171',
            ],
            [
                'status' => 'For Checking',
                'count' => $counts['for_checking'] ?? 0,
                'color' => '#06b6d4',
            ],
            [
                'status' => 'Query',
                'count' => $counts['query'] ?? 0,
                'color' => '#f59e0b',
            ],
            [
                'status' => 'Submitted',
                'count' => $counts['submitted'] ?? 0,
                'color' => '#10b981',
            ],
            [
                'status' => 'On Hold',
                'count' => $counts['on_hold'] ?? 0,
                'color' => '#7c3aed',
            ],
            [
                'status' => 'Cancelled',
                'count' => $counts['cancelled'] ?? 0,
                'color' => '#f43f5e',
            ],
        ];
    }

    public function mapBoardStatus(?string $status): string
    {
        return match ($status) {
            DraftingRequest::STATUS_ASSIGNED => 'assigned',
            DraftingRequest::STATUS_DESIGN_WIP => 'design_wip',
            DraftingRequest::STATUS_DRAFTING_WIP,
            DraftingRequest::STATUS_WIP => 'drafting_wip',
            DraftingRequest::STATUS_FOR_CHECKING => 'for_checking',
            DraftingRequest::STATUS_QUERY => 'query',
            DraftingRequest::STATUS_SUBMITTED => 'submitted',
            DraftingRequest::STATUS_ON_HOLD => 'on_hold',
            DraftingRequest::STATUS_CANCELLED => 'cancelled',
            DraftingRequest::STATUS_NEW => 'new',
            default => 'new',
        };
    }

    public function boardStatusLabel(string $boardStatus, string $fallback): string
    {
        return match ($boardStatus) {
            'new' => 'New',
            'assigned' => 'Assigned',
            'design_wip', 'drafting_wip', 'wip' => 'Work In Progress',
            'for_checking' => 'For Checking',
            'query' => 'Query',
            'submitted' => 'Submitted',
            'on_hold' => 'On Hold',
            'cancelled' => 'Cancelled',
            default => $fallback,
        };
    }

    public function mapJobListGroup(DraftingRequest $row): string
    {
        $status = $row->status ?? DraftingRequest::STATUS_NEW;

        if (in_array($status, [
            DraftingRequest::STATUS_PAID,
            DraftingRequest::STATUS_INVOICED,
            DraftingRequest::STATUS_SUBMITTED,
        ], true)) {
            return 'completed_projects';
        }

        if ($status === DraftingRequest::STATUS_CANCELLED) {
            return 'cancelled_jobs';
        }

        if (in_array($status, [
            DraftingRequest::STATUS_FOR_QUOTE,
            DraftingRequest::STATUS_QUOTE_SENT,
            DraftingRequest::STATUS_NEW,
        ], true)) {
            return 'for_quotes';
        }

        if (in_array($status, [
            DraftingRequest::STATUS_DESIGN_WIP,
            DraftingRequest::STATUS_ASSIGNED,
            DraftingRequest::STATUS_ON_HOLD,
            DraftingRequest::STATUS_QUERY,
        ], true)) {
            return 'drafting_wip';
        }

        if (in_array($status, [
            DraftingRequest::STATUS_DRAFTING_WIP,
            DraftingRequest::STATUS_WIP,
            DraftingRequest::STATUS_FOR_CHECKING,
        ], true)) {
            return 'drafting_wip';
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

    public function isDesignPhaseRequest(DraftingRequest $row): bool
    {
        $row->loadMissing('serviceEngagings');
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
            'design_wip' => [
                ['color' => '#c026d3', 'weight' => 2],
                ['color' => '#f472b6', 'weight' => 1],
            ],
            'drafting_wip', 'wip' => [
                ['color' => '#f472b6', 'weight' => 2],
                ['color' => '#f97316', 'weight' => 2],
                ['color' => '#8b5cf6', 'weight' => 1],
            ],
            'submitted' => [
                ['color' => '#10b981', 'weight' => 3],
            ],
            'cancelled', 'on_hold' => [
                ['color' => '#f43f5e', 'weight' => 3],
            ],
            default => [
                ['color' => '#64748b', 'weight' => 2],
                ['color' => '#475569', 'weight' => 1],
            ],
        };
    }
}
