<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDraftingRequestFormRequest;
use App\Http\Requests\StoreDraftingRequestRevisionRequest;
use App\Http\Requests\UpdateDraftingRequestAssignmentRequest;
use App\Http\Requests\UpdateDraftingRequestBoardFieldsRequest;
use App\Models\BuildingClass;
use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestAssignment;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\SdaType;
use App\Models\StoreyLevel;
use App\Models\User;
use App\Services\DraftingRequestBoardService;
use App\Services\DraftingRequestReviewService;
use App\Services\DraftingRequestSubmissionService;
use App\Support\ClientFormOptions;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobBoardController extends Controller
{
    public function __construct(
        private DraftingRequestBoardService $board,
        private DraftingRequestReviewService $review,
        private DraftingRequestSubmissionService $submission,
    ) {}

    public function index(Request $request): RedirectResponse
    {
        return redirect()->route('job.list', $request->query());
    }

    public function list(Request $request): Response
    {
        return $this->renderBoard($request, [
            'board' => 'apm',
        ]);
    }

    public function designList(Request $request): Response
    {
        return $this->renderBoard($request, [
            'pageTitle' => 'Design Project Management',
            'pageDescription' => 'All design jobs on the project board, grouped by status.',
            'searchRoute' => 'design.list',
            'statusGroupOptions' => DraftingRequest::designListStatusOptions(),
            'showAddFromMasterlist' => true,
            'showPendingRequests' => false,
            'forwardPermission' => 'design.list.view',
            'board' => 'design',
        ]);
    }

    /**
     * @param  array{
     *     pageTitle?: string,
     *     pageDescription?: string|null,
     *     searchRoute?: string,
     *     statusFilter?: list<string>|null,
     *     statusGroupOptions?: array<string, string>|null,
     *     showAddFromMasterlist?: bool,
     *     showPendingRequests?: bool,
     *     forwardPermission?: string,
     *     board?: string,
     *     groupByStatus?: bool,
     * }  $options
     */
    private function renderBoard(Request $request, array $options = []): Response
    {
        $this->submission->returnOrphanApmJobsToMasterlist($request->user());

        $filters = $this->board->resolveListFilters($request);
        $groupByStatus = $options['groupByStatus'] ?? true;
        $statusFilter = $options['statusFilter'] ?? null;
        $showAddFromMasterlist = $options['showAddFromMasterlist'] ?? true;
        $showPendingRequests = $options['showPendingRequests'] ?? true;
        $forwardPermission = $options['forwardPermission'] ?? 'job.list.view';
        $board = ($options['board'] ?? 'apm') === 'design' ? 'design' : 'apm';
        $statusGroupOptions = $this->formatStatusOptionList(
            $options['statusGroupOptions'] ?? DraftingRequest::jobListStatusOptions(),
        );

        $query = $this->board->baseQuery($request, $board);
        if (is_array($statusFilter) && $statusFilter !== []) {
            $query->whereIn('status', $statusFilter);
        }
        $this->board->applySearch($query, $filters['search']);

        $user = $request->user();
        $canReviewPublicRequests = $showPendingRequests
            && ($user?->hasPermission('job.drafting-request.review') ?? false);
        $canForwardFromMasterlist = $showAddFromMasterlist
            && ($user?->hasPermission($forwardPermission) ?? false);
        $canAddRevision = $user?->hasPermission('job.drafting.revision.add') ?? false;
        $formatRow = function (DraftingRequest $row) use ($request, $canAddRevision) {
            $formatted = $this->board->formatBoardRow($row);
            $formatted['can_assign'] = $this->board->canAssignStaff($request, $row);
            $formatted['can_add_revision'] = $canAddRevision
                && $this->board->canAssignStaff($request, $row);

            return $formatted;
        };

        return Inertia::render('Job/Board', [
            'jobs' => (clone $query)
                ->paginate($filters['per_page'])
                ->through($formatRow)
                ->withQueryString(),
            'paginatedStatusGroups' => $groupByStatus
                ? $this->paginateStatusGroups(
                    $query,
                    $filters['per_page'],
                    $statusGroupOptions,
                    $formatRow,
                )
                : [],
            'filters' => $filters,
            'pageTitle' => $options['pageTitle'] ?? 'Archi Project Management',
            'pageDescription' => $options['pageDescription'] ?? null,
            'searchRoute' => $options['searchRoute'] ?? 'job.list',
            'board' => $board,
            'canViewAllRequests' => $user?->hasPermission('job.list.view') ?? false,
            'canReviewPublicRequests' => $canReviewPublicRequests,
            'canForwardFromMasterlist' => $canForwardFromMasterlist,
            'showAddFromMasterlist' => $showAddFromMasterlist,
            'showPendingRequests' => $showPendingRequests,
            'masterlistCandidates' => $canForwardFromMasterlist
                ? $this->masterlistCandidatesForBoard($request, $board)
                : [],
            'pendingRequests' => $canReviewPublicRequests
                ? $this->review->pendingQuery()
                    ->limit(50)
                    ->get()
                    ->map(fn (DraftingRequest $row) => $this->review->formatPendingRow($row))
                    ->values()
                    ->all()
                : [],
            'assignableUsers' => $this->board->assignableUsers(),
            'statusOptions' => $this->formatStatusOptionList(
                DraftingRequest::jobBoardStatusOptions(),
            ),
            'statusGroupOptions' => $statusGroupOptions,
            'categoryOptions' => CrmCategory::query()
                ->active()
                ->where('status', 'active')
                ->orderBy('code')
                ->get(['id', 'code', 'name'])
                ->map(fn (CrmCategory $row) => [
                    'id' => $row->id,
                    'code' => $row->code ?: $row->name,
                    'name' => $row->name,
                ])
                ->values()
                ->all(),
            'groupByStatus' => $groupByStatus,
            'jobListSections' => [],
        ]);
    }

    /**
     * @param  Builder<DraftingRequest>  $query
     * @param  array<int, array{value: string, label: string}>  $statusGroupOptions
     * @param  callable(DraftingRequest): array<string, mixed>  $formatRow
     * @return array<int, array{status: string, label: string, pagination: \Illuminate\Pagination\LengthAwarePaginator}>
     */
    private function paginateStatusGroups(
        Builder $query,
        int $perPage,
        array $statusGroupOptions,
        callable $formatRow,
    ): array {
        return collect($statusGroupOptions)
            ->map(function (array $option) use ($query, $perPage, $formatRow): array {
                $pageName = 'page_'.$option['value'];

                return [
                    'status' => $option['value'],
                    'label' => $option['label'],
                    'pagination' => (clone $query)
                        ->whereIn('status', $this->statusGroupMembers($option['value']))
                        ->paginate($perPage, ['*'], $pageName)
                        ->through($formatRow)
                        ->withQueryString(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    private function statusGroupMembers(string $status): array
    {
        return match ($status) {
            DraftingRequest::STATUS_NEW => [
                DraftingRequest::STATUS_NEW,
                DraftingRequest::STATUS_FOR_QUOTE,
                'for_quotes',
            ],
            DraftingRequest::STATUS_DRAFTING_WIP => [
                DraftingRequest::STATUS_ASSIGNED,
                DraftingRequest::STATUS_DESIGN_WIP,
                DraftingRequest::STATUS_DRAFTING_WIP,
                DraftingRequest::STATUS_WIP,
                DraftingRequest::STATUS_QUERY,
                DraftingRequest::STATUS_ON_HOLD,
            ],
            DraftingRequest::STATUS_FOR_CHECKING => [
                DraftingRequest::STATUS_FOR_CHECKING,
            ],
            DraftingRequest::STATUS_SUBMITTED => [
                DraftingRequest::STATUS_SUBMITTED,
                DraftingRequest::STATUS_QUOTE_SENT,
                DraftingRequest::STATUS_INVOICED,
                DraftingRequest::STATUS_PAID,
                'completed_projects',
            ],
            DraftingRequest::STATUS_CANCELLED => [
                DraftingRequest::STATUS_CANCELLED,
                'cancelled_jobs',
            ],
            default => [$status],
        };
    }

    /**
     * @param  array<string, string>  $options
     * @return list<array{value: string, label: string}>
     */
    private function formatStatusOptionList(array $options): array
    {
        return collect($options)
            ->reject(function (string $label, string $value) use ($options): bool {
                return in_array($value, ['design_wip', 'wip'], true)
                    && array_key_exists('drafting_wip', $options);
            })
            ->map(function (string $label, string $value): array {
                if (in_array($value, ['design_wip', 'drafting_wip', 'wip'], true)) {
                    $label = 'Work In Progress';
                }

                return [
                    'value' => $value,
                    'label' => $label,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Masterlist entries and all active board drafts for the Add control.
     *
     * @return list<array{
     *     id: int,
     *     value: string,
     *     label: string,
     *     lead_no: string,
     *     source: string,
     *     status: string,
     *     revisions: list<array{code: string}>,
     *     suggested_code: string
     * }>
     */
    private function masterlistCandidatesForBoard(Request $request, string $board = 'apm'): array
    {
        $user = $request->user();
        $search = trim((string) ($request->input('q') ?? $request->input('search') ?? ''));
        $byId = [];

        foreach ($this->formatAddCandidates(
            $this->masterlistCandidateQuery($user)->get(),
            'masterlist',
        ) as $row) {
            $byId[$row['id']] = $row;
        }

        foreach ($this->formatAddCandidates(
            $this->boardCandidateQuery($user, $board)->get(),
            $board,
        ) as $row) {
            $byId[$row['id']] = $row;
        }

        if ($search !== '') {
            foreach ($this->formatAddCandidates(
                $this->searchBoardCandidateQuery($user, $search, $board)->get(),
                $board,
            ) as $row) {
                $byId[$row['id']] = $row;
            }
        }

        // Newest job numbers first so the latest drafts are at the top of Add item.
        return collect(array_values($byId))
            ->sort(function (array $left, array $right) {
                $byLead = strnatcasecmp(
                    (string) ($right['lead_no'] ?? ''),
                    (string) ($left['lead_no'] ?? ''),
                );
                if ($byLead !== 0) {
                    return $byLead;
                }

                return ((int) ($right['id'] ?? 0)) <=> ((int) ($left['id'] ?? 0));
            })
            ->values()
            ->all();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, DraftingRequest>  $rows
     * @return list<array{
     *     id: int,
     *     value: string,
     *     label: string,
     *     lead_no: string,
     *     source: string,
     *     status: string,
     *     revisions: list<array{code: string}>,
     *     suggested_code: string
     * }>
     */
    private function formatAddCandidates($rows, string $source): array
    {
        $statusLabels = DraftingRequest::statusLabels();

        return $rows
            ->map(function (DraftingRequest $row) use ($source, $statusLabels) {
                $row->loadMissing([
                    'revisions' => fn ($query) => $query
                        ->orderBy('id')
                        ->select('id', 'drafting_request_id', 'code'),
                ]);

                $leadNo = $row->jobNumber();
                $client = $row->company_name ?: ($row->your_name ?: '—');
                $job = $row->site_address ?: '—';
                $status = $row->status ?? DraftingRequest::STATUS_NEW;

                if ($source === 'apm' || $source === 'design') {
                    $statusLabel = $statusLabels[$status]
                        ?? ucfirst(str_replace('_', ' ', $status));
                    $boardLabel = $source === 'design' ? 'Design' : 'APM';
                    $label = "[{$boardLabel}] {$leadNo} — {$client} — {$job} · {$statusLabel}";
                } else {
                    $label = "[Masterlist] {$leadNo} — {$client} — {$job}";
                }

                $revisions = $row->revisions
                    ->sortBy('id')
                    ->map(fn ($revision) => [
                        'code' => trim((string) ($revision->code ?? '')),
                    ])
                    ->values()
                    ->all();

                $latestRevision = $row->latestRevisionCode();
                if ($latestRevision) {
                    $label .= " · last {$latestRevision}";
                }

                return [
                    'id' => $row->id,
                    'value' => (string) $row->id,
                    'lead_no' => $leadNo,
                    'label' => $label,
                    'source' => $source,
                    'status' => $status,
                    'revisions' => $revisions,
                    'suggested_code' => $row->suggestNextRevisionCode(),
                    'latest_revision' => $latestRevision,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<DraftingRequest>
     */
    private function masterlistCandidateQuery(?User $user)
    {
        return DraftingRequest::query()
            ->masterlist()
            ->reviewAccepted()
            ->active()
            ->with($this->addCandidateRevisionRelations())
            ->orderByDesc('requested_at')
            ->orderByDesc('id');
    }

    /**
     * All active board drafts on this board (any status), including every APM-stage job.
     *
     * @return \Illuminate\Database\Eloquent\Builder<DraftingRequest>
     */
    private function boardCandidateQuery(?User $user, string $board)
    {
        $query = DraftingRequest::query()
            ->reviewAccepted()
            ->active()
            ->with($this->addCandidateRevisionRelations())
            ->orderByDesc('updated_at')
            ->orderByDesc('requested_at')
            ->orderByDesc('id');

        if ($board === 'design') {
            $query->where(function ($outer) {
                $outer->where('workflow_stage', DraftingRequest::STAGE_DESIGN)
                    ->orWhere('workflow_stage', DraftingRequest::STAGE_APM);
            });
        } else {
            // Show every job already on APM — do not hide design-phase rows here.
            $query->where('workflow_stage', DraftingRequest::STAGE_APM);
        }

        return $query;
    }

    /**
     * @return array<string, mixed>
     */
    private function addCandidateRevisionRelations(): array
    {
        return [
            'revisions' => fn ($query) => $query
                ->orderBy('id')
                ->select('id', 'drafting_request_id', 'code'),
        ];
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<DraftingRequest>
     */
    private function searchBoardCandidateQuery(?User $user, string $search, string $board)
    {
        $query = $this->boardCandidateQuery($user, $board);

        $digits = preg_replace('/\D+/', '', $search) ?? '';

        $query->where(function ($q) use ($search, $digits) {
            $q->where('company_name', 'like', '%'.$search.'%')
                ->orWhere('your_name', 'like', '%'.$search.'%')
                ->orWhere('site_address', 'like', '%'.$search.'%')
                ->orWhere('site_owner_name', 'like', '%'.$search.'%')
                ->orWhere('lead_number', 'like', '%'.$search.'%');

            if ($digits !== '') {
                $q->orWhere('id', (int) $digits)
                    ->orWhere('lead_number', 'like', '%'.$digits.'%');

                if (strlen($digits) >= 3) {
                    $q->orWhere('id', (int) substr($digits, -3));
                }

                if (preg_match('/^(\d{2})(\d+)$/', $digits, $match)) {
                    $q->orWhere('id', (int) $match[2]);
                }
            }
        });

        return $query;
    }

    public function addToBoard(Request $request, DraftingRequest $draftingRequest): RedirectResponse
    {
        $board = $this->requestedBoard($request);
        $this->assertCanAddToBoard($request, $board);

        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        $this->assertAddableToBoard($draftingRequest);

        $result = $this->submission->addOrReopenOnBoard($draftingRequest, $user, $board);

        return $this->redirectAfterBoardAdd($draftingRequest, $result, $board);
    }

    /**
     * Accept slim revision fields from the modal and add the project to the board directly.
     */
    public function quickAddToBoard(
        Request $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        $board = $this->requestedBoard($request);
        $this->assertCanAddToBoard($request, $board);

        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        $this->assertAddableToBoard($draftingRequest);

        $categoryCodes = \App\Models\CrmCategory::query()
            ->active()
            ->orderBy('code')
            ->get(['code', 'name'])
            ->flatMap(fn ($row) => array_filter([$row->code, $row->name]))
            ->unique()
            ->values()
            ->all();

        $allowedStatuses = array_values(array_unique([
            ...array_keys(DraftingRequest::jobBoardStatusOptions()),
            ...DraftingRequest::statusValues(),
        ]));

        $validated = $request->validate([
            'code'     => ['required', 'string', 'max:64'],
            'link'     => ['nullable', 'string', 'max:2048'],
            'log_date' => ['required', 'date'],
            'category' => ['required', 'string', 'max:255', \Illuminate\Validation\Rule::in($categoryCodes)],
            'status'   => ['required', 'string', \Illuminate\Validation\Rule::in($allowedStatuses)],
        ]);

        // Store the revision first.
        $draftingRequest->revisions()->create([
            'user_id'  => $user->id,
            'code'     => $validated['code'],
            'link'     => filled($validated['link'] ?? null)
                ? \App\Support\PublicUrl::rewriteLocalhost($validated['link'])
                : null,
            'log_date' => $validated['log_date'],
            'category' => $validated['category'],
            'status'   => $validated['status'],
        ]);

        $draftingRequest->forceFill([
            'status' => $validated['status'],
        ])->save();

        $result = $this->submission->addOrReopenOnBoard($draftingRequest->fresh(), $user, $board);

        return $this->redirectAfterBoardAdd($draftingRequest, $result, $board);
    }

    /**
     * Review / edit a candidate before adding it to the APM board.
     */
    public function reviewBeforeAdd(Request $request, DraftingRequest $draftingRequest): Response
    {
        abort_unless(
            $request->user()?->hasPermission('job.list.view'),
            403,
        );

        $this->assertAddableToBoard($draftingRequest);

        $draftingRequest->loadMissing([
            'crmCategories:id,name,code',
            'sdaTypes:id,name,code',
            'serviceEngagings:id,name',
            'client',
        ]);

        return Inertia::render('Job/DraftingRequestForm', [
            'standalone' => false,
            'submitted' => false,
            'mode' => 'edit',
            'submitUrl' => route('job.board.add.confirm', $draftingRequest),
            'backUrl' => route('job.list'),
            'formTitle' => 'Review before adding to board',
            'submitLabel' => 'Save & add to board',
            'applicant' => $this->applicantFormData($draftingRequest),
            ...$this->formOptions($draftingRequest->client_id),
        ]);
    }

    /**
     * Persist edits, then forward / reopen on the board.
     */
    public function confirmAddToBoard(
        StoreDraftingRequestFormRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        $board = $this->requestedBoard($request);
        $this->assertCanAddToBoard($request, $board);

        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        $this->assertAddableToBoard($draftingRequest);

        $this->submission->update($request, $draftingRequest, $user, allowApmStage: true);

        $result = $this->submission->addOrReopenOnBoard($draftingRequest->fresh(), $user, $board);

        return $this->redirectAfterBoardAdd($draftingRequest, $result, $board);
    }

    private function assertAddableToBoard(DraftingRequest $draftingRequest): void
    {
        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        if ($draftingRequest->review_status !== DraftingRequest::REVIEW_ACCEPTED) {
            abort(404);
        }

        $stage = $draftingRequest->workflow_stage;

        if ($stage === DraftingRequest::STAGE_MASTERLIST) {
            return;
        }

        if ($draftingRequest->isOnProjectBoard()) {
            return;
        }

        abort(404);
    }

    private function requestedBoard(Request $request): string
    {
        $board = strtolower(trim((string) $request->input('board', '')));

        if ($board === 'design') {
            return 'design';
        }

        $referer = (string) $request->headers->get('referer', '');
        if ($referer !== '' && str_contains($referer, '/design/list')) {
            return 'design';
        }

        return 'apm';
    }

    private function assertCanAddToBoard(Request $request, string $board): void
    {
        $permission = $board === 'design' ? 'design.list.view' : 'job.list.view';

        abort_unless($request->user()?->hasPermission($permission), 403);
    }

    /**
     * @param  array{action: 'forwarded'|'reopened', revision_code: string|null}  $result
     */
    private function redirectAfterBoardAdd(
        DraftingRequest $draftingRequest,
        array $result,
        string $board,
    ): RedirectResponse {
        if ($board === 'design') {
            $redirect = redirect()
                ->route('design.list')
                ->with(
                    'status',
                    $result['action'] === 'reopened'
                        ? 'board-reopened'
                        : 'design-masterlist-forwarded',
                );

            if ($result['action'] === 'reopened' && $result['revision_code']) {
                $redirect->with('revision_code', $result['revision_code']);
            }

            return $redirect;
        }

        if ($result['action'] === 'reopened') {
            return redirect()
                ->route('job.drafting.show', $draftingRequest)
                ->with('status', 'board-reopened')
                ->with('revision_code', $result['revision_code']);
        }

        return redirect()
            ->route('job.drafting.show', $draftingRequest)
            ->with('status', 'masterlist-forwarded');
    }

    /**
     * @return array<string, mixed>
     */
    private function applicantFormData(DraftingRequest $draftingRequest): array
    {
        $tz = config('app.timezone');
        $requestedAt = $draftingRequest->requested_at
            ? $draftingRequest->requested_at->timezone($tz)->seconds(0)->format('Y-m-d\TH:i')
            : now($tz)->seconds(0)->format('Y-m-d\TH:i');

        return [
            'id' => $draftingRequest->id,
            'lead_number' => $draftingRequest->lead_number ?: $draftingRequest->jobNumber(),
            'requested_at' => $requestedAt,
            'your_name' => $draftingRequest->your_name,
            'client_id' => $draftingRequest->client_id,
            'client_contact_id' => $draftingRequest->client_contact_id,
            'company_name' => $draftingRequest->company_name,
            'email' => $draftingRequest->email,
            'phone' => $draftingRequest->phone,
            'service_engaging_ids' => $draftingRequest->serviceEngagings()->pluck('service_engagings.id')->all(),
            'crm_category_id' => $draftingRequest->crm_category_id,
            'crm_category_ids' => $draftingRequest->crmCategories()->pluck('crm_categories.id')->all()
                ?: array_values(array_filter([(int) $draftingRequest->crm_category_id])),
            'site_address' => $draftingRequest->site_address,
            'council_shire' => $draftingRequest->council_shire,
            'site_owner_name' => $draftingRequest->site_owner_name,
            'max_building_area_sqm' => $draftingRequest->max_building_area_sqm,
            'storey_level_id' => $draftingRequest->storey_level_id,
            'building_class_id' => $draftingRequest->building_class_id,
            'zoning' => $draftingRequest->zoning,
            'sda_type_ids' => $draftingRequest->sdaTypes()->pluck('sda_types.id')->all(),
            'ndis_sda' => (bool) $draftingRequest->ndis_sda,
            'external_wall_construction_id' => $draftingRequest->external_wall_construction_id,
            'roof_type_id' => $draftingRequest->roof_type_id,
            'ceiling_heights' => $draftingRequest->ceiling_heights,
            'first_floor_slab' => $draftingRequest->first_floor_slab,
            'additional_inclusions' => $draftingRequest->additional_inclusions,
        ];
    }

    /**
     * @return array{
     *     clients: \Illuminate\Support\Collection,
     *     categories: \Illuminate\Support\Collection,
     *     sdaTypes: \Illuminate\Support\Collection,
     *     storeyLevels: \Illuminate\Support\Collection,
     *     buildingClasses: \Illuminate\Support\Collection,
     *     externalWallConstructions: \Illuminate\Support\Collection,
     *     roofTypes: \Illuminate\Support\Collection
     * }
     */
    private function formOptions(?int $includeClientId = null): array
    {
        return [
            'clients' => ClientFormOptions::forForms($includeClientId),
            'categories' => CrmCategory::query()
                ->active()
                ->orderBy('code')
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'sdaTypes' => SdaType::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'storeyLevels' => StoreyLevel::query()
                ->active()
                ->orderBy('code')
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'buildingClasses' => BuildingClass::activeForSelect(),
            'externalWallConstructions' => ExternalWallConstruction::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
            'roofTypes' => RoofType::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
        ];
    }

    public function statusChart(Request $request): Response
    {
        $jobStatusDate = $request->string('job_status_date')->toString();
        $jobStatusDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', $jobStatusDate)
            ? $jobStatusDate
            : null;

        return Inertia::render('Job/StatusChart', [
            'jobStatusChart' => $this->board->jobStatusChartPayload($request, $jobStatusDate),
        ]);
    }

    public function redirectFromLegacyList(Request $request): RedirectResponse
    {
        return redirect()->route('job.list', $request->query());
    }

    public function togglePriority(Request $request, DraftingRequest $draftingRequest): RedirectResponse
    {
        if (! $this->board->canAssignStaff($request, $draftingRequest)) {
            abort(403);
        }

        $draftingRequest->update([
            'is_priority' => ! $draftingRequest->is_priority,
        ]);

        return back();
    }

    public function updateAssignment(
        UpdateDraftingRequestAssignmentRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        if (! $this->board->canAssignStaff($request, $draftingRequest)) {
            abort(403);
        }

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        $validated = $request->validated();
        $role = $validated['role'];
        $slot = (int) $validated['slot'];

        if ($slot > $this->board->maxSlotForRole($role)) {
            abort(422);
        }

        $previousUserId = DraftingRequestAssignment::query()
            ->where('drafting_request_id', $draftingRequest->id)
            ->where('role', $role)
            ->where('slot', $slot)
            ->value('user_id');
        $previousUserId = $previousUserId !== null ? (int) $previousUserId : null;
        $nextUserId = $validated['user_id'] !== null ? (int) $validated['user_id'] : null;

        if ($validated['user_id'] === null) {
            DraftingRequestAssignment::query()
                ->where('drafting_request_id', $draftingRequest->id)
                ->where('role', $role)
                ->where('slot', $slot)
                ->delete();

            $this->board->syncAssignmentToRevision(
                $draftingRequest,
                $role,
                $slot,
                null,
                null,
            );
        } else {
            DraftingRequestAssignment::query()->updateOrCreate(
                [
                    'drafting_request_id' => $draftingRequest->id,
                    'role' => $role,
                    'slot' => $slot,
                ],
                [
                    'user_id' => $validated['user_id'],
                    'hours' => $validated['hours'] ?? null,
                ],
            );

            $this->board->syncAssignmentToRevision(
                $draftingRequest,
                $role,
                $slot,
                (int) $validated['user_id'],
                $validated['hours'] ?? null,
            );
        }

        if ($previousUserId !== $nextUserId) {
            $this->recordAssignmentChange(
                $draftingRequest,
                $request->user(),
                $role,
                $slot,
                $previousUserId,
                $nextUserId,
            );
        }

        return back();
    }

    private function recordAssignmentChange(
        DraftingRequest $draftingRequest,
        ?User $actor,
        string $role,
        int $slot,
        ?int $previousUserId,
        ?int $nextUserId,
    ): void {
        $roleLabel = $role === DraftingRequestAssignment::ROLE_CHECKING
            ? 'Checker'
            : 'Drafter';

        $userIds = array_values(array_filter([$previousUserId, $nextUserId]));
        $names = $userIds === []
            ? []
            : User::query()
                ->whereIn('id', $userIds)
                ->pluck('name', 'id')
                ->all();

        $fromName = $previousUserId !== null
            ? ($names[$previousUserId] ?? 'Unknown')
            : 'Unassigned';
        $toName = $nextUserId !== null
            ? ($names[$nextUserId] ?? 'Unknown')
            : 'Unassigned';

        $revisionCode = $draftingRequest->revisions()
            ->orderByDesc('log_date')
            ->orderByDesc('id')
            ->value('code');

        $slotLabel = $slot > 0 ? ' slot '.($slot + 1) : '';
        $revisionLabel = $revisionCode ? " on revision {$revisionCode}" : '';

        DraftingRequestActivity::record(
            $draftingRequest,
            $actor,
            DraftingRequestActivity::ACTION_ASSIGNMENT_CHANGED,
            sprintf(
                '%s%s%s changed from %s to %s.',
                $roleLabel,
                $slotLabel,
                $revisionLabel,
                $fromName,
                $toName,
            ),
        );
    }

    public function updateBoardFields(
        UpdateDraftingRequestBoardFieldsRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        if (! $this->board->canAssignStaff($request, $draftingRequest)) {
            abort(403);
        }

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        $validated = $request->validated();

        if (array_key_exists('status', $validated)) {
            $previousStatus = $draftingRequest->status;
            $newStatus = $validated['status'];

            if ($previousStatus !== $newStatus) {
                $draftingRequest->update(['status' => $newStatus]);
                $this->board->syncBoardStatusToLatestRevision(
                    $draftingRequest,
                    $newStatus,
                );

                $options = DraftingRequest::statusOptions();
                $fromLabel = $options[$previousStatus]
                    ?? ($previousStatus ? ucfirst(str_replace('_', ' ', $previousStatus)) : 'New');
                $toLabel = $options[$newStatus] ?? ucfirst(str_replace('_', ' ', $newStatus));

                DraftingRequestActivity::record(
                    $draftingRequest,
                    $request->user(),
                    DraftingRequestActivity::ACTION_STATUS_CHANGED,
                    sprintf('Status changed from %s to %s.', $fromLabel, $toLabel),
                );
            }
        }

        if (array_key_exists('start_date', $validated)) {
            $draftingRequest->update([
                'start_date' => $validated['start_date'],
            ]);
        }

        if (array_key_exists('date_out', $validated)) {
            $draftingRequest->update([
                'date_out' => $validated['date_out'],
            ]);
        }

        if (array_key_exists('eta', $validated)) {
            $draftingRequest->update([
                'eta' => $validated['eta'],
            ]);
        }

        if (array_key_exists('date_in', $validated)) {
            if ($validated['date_in'] === null) {
                $draftingRequest->update(['requested_at' => null]);
            } else {
                $tz = config('app.timezone');
                $existing = $draftingRequest->requested_at?->timezone($tz);
                $next = Carbon::parse($validated['date_in'], $tz)->setTime(
                    $existing?->hour ?? 0,
                    $existing?->minute ?? 0,
                    $existing?->second ?? 0,
                );
                $draftingRequest->update(['requested_at' => $next]);
            }
        }

        if (array_key_exists('vo_hours', $validated)) {
            $draftingRequest->update([
                'vo_hours' => $validated['vo_hours'],
            ]);
        }

        if (array_key_exists('max_building_area_sqm', $validated)) {
            $draftingRequest->update([
                'max_building_area_sqm' => $validated['max_building_area_sqm'],
            ]);
        }

        return back();
    }
}
