<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDraftingRequestFormRequest;
use App\Models\BuildingClass;
use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\SdaType;
use App\Models\StoreyLevel;
use App\Services\DraftingRequestBoardService;
use App\Services\DraftingRequestSubmissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MasterlistController extends Controller
{
    public function __construct(
        private DraftingRequestSubmissionService $submission,
        private DraftingRequestBoardService $board,
        private DraftingController $drafting,
    ) {}

    public function index(Request $request): Response
    {
        [$search, $perPage, $sort, $direction] = $this->resolveListFilters($request);

        $query = DraftingRequest::query()
            ->with([
                'buildingType:id,name',
                'storeyLevel:id,name,code',
                'crmCategory:id,name,code',
                'crmCategories:id,name,code',
                'serviceEngagings:id,name',
                'assignments' => fn ($relation) => $relation
                    ->with('user:id,name,initials')
                    ->orderBy('role')
                    ->orderBy('slot'),
                'revisions' => fn ($relation) => $relation
                    ->with(['drafter:id,name,initials', 'checker:id,name,initials'])
                    ->orderByDesc('log_date')
                    ->orderByDesc('id'),
                'accountEntries' => fn ($relation) => $relation->orderByDesc('id'),
            ])
            ->withCount(['files', 'comments'])
            ->whereIn('workflow_stage', [
                DraftingRequest::STAGE_MASTERLIST,
                DraftingRequest::STAGE_APM,
            ])
            ->reviewAccepted()
            ->active();

        $this->board->applySearch($query, $search);

        $this->applySort($query, $sort, $direction);

        $user = $request->user();

        return Inertia::render('Job/Masterlist/Index', [
            'draftingRequests' => $query
                ->paginate($perPage)
                ->through(function (DraftingRequest $row) {
                    $formatted = $this->board->formatBoardRow($row);
                    $formatted['workflow_stage'] = $row->workflow_stage;
                    $formatted['can_edit_masterlist'] =
                        $row->workflow_stage === DraftingRequest::STAGE_MASTERLIST;

                    return $formatted;
                })
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sort,
                'direction' => $direction,
            ],
            'canForwardToApm' => $user?->hasPermission('job.list.view') ?? false,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Job/DraftingRequestForm', [
            'standalone' => false,
            'submitted' => false,
            'mode' => 'create',
            'submitUrl' => route('job.masterlist.store'),
            'backUrl' => route('job.masterlist'),
            'formTitle' => 'Encode project info',
            'applicant' => [
                'requested_at' => now(config('app.timezone'))->seconds(0)->format('Y-m-d\TH:i'),
                'your_name' => $request->user()?->name,
                'lead_number' => '',
            ],
            ...$this->formOptions(),
        ]);
    }

    public function store(StoreDraftingRequestFormRequest $request): RedirectResponse
    {
        $this->submission->store(
            $request,
            $request->user(),
            DraftingRequest::REVIEW_ACCEPTED,
            DraftingRequest::STAGE_MASTERLIST,
        );

        return redirect()
            ->route('job.masterlist')
            ->with('status', 'masterlist-created');
    }

    public function show(Request $request, DraftingRequest $draftingRequest): Response
    {
        $this->authorizeMasterlistView($request, $draftingRequest);

        return $this->drafting->renderJobShow($request, $draftingRequest, [
            'from' => 'masterlist',
        ]);
    }

    public function edit(Request $request, DraftingRequest $draftingRequest): Response
    {
        $this->authorizeMasterlist($request, $draftingRequest);

        return Inertia::render('Job/DraftingRequestForm', [
            'standalone' => false,
            'submitted' => false,
            'mode' => 'edit',
            'submitUrl' => route('job.masterlist.update', $draftingRequest),
            'backUrl' => route('job.masterlist'),
            'formTitle' => 'Edit masterlist entry',
            'applicant' => $this->applicantFormData($draftingRequest),
            ...$this->formOptions($draftingRequest->client_id),
        ]);
    }

    public function duplicate(Request $request, DraftingRequest $draftingRequest): Response
    {
        $this->authorizeMasterlistView($request, $draftingRequest);

        $applicant = $this->applicantFormData($draftingRequest);
        unset($applicant['id']);
        $applicant['lead_number'] = '';
        $applicant['requested_at'] = now(config('app.timezone'))->seconds(0)->format('Y-m-d\TH:i');
        $applicant['your_name'] = $request->user()?->name ?? $applicant['your_name'];

        return Inertia::render('Job/DraftingRequestForm', [
            'standalone' => false,
            'submitted' => false,
            'mode' => 'create',
            'submitUrl' => route('job.masterlist.store'),
            'backUrl' => route('job.masterlist'),
            'formTitle' => 'Duplicate project info',
            'sourceReference' => $draftingRequest->jobNumber(),
            'applicant' => $applicant,
            ...$this->formOptions($draftingRequest->client_id),
        ]);
    }

    public function update(
        StoreDraftingRequestFormRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        $this->authorizeMasterlist($request, $draftingRequest);

        $this->submission->update($request, $draftingRequest, $request->user());

        return redirect()
            ->route('job.masterlist')
            ->with('status', 'masterlist-updated');
    }

    public function forward(Request $request, DraftingRequest $draftingRequest): RedirectResponse
    {
        abort_unless(
            $request->user()?->hasPermission('job.list.view'),
            403,
        );

        $this->authorizeMasterlist($request, $draftingRequest);

        $this->submission->forwardToApm($draftingRequest, $request->user());

        $redirect = (string) $request->input('redirect', 'masterlist');

        if ($redirect === 'show') {
            return redirect()
                ->route('job.drafting.show', $draftingRequest)
                ->with('status', 'masterlist-forwarded');
        }

        if ($redirect === 'board') {
            return redirect()
                ->route('job.list')
                ->with('status', 'masterlist-forwarded');
        }

        return redirect()
            ->route('job.masterlist')
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
            'clients' => \App\Support\ClientFormOptions::forForms($includeClientId),
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
            'buildingClasses' => BuildingClass::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
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

    private function authorizeMasterlistView(Request $request, DraftingRequest $draftingRequest): void
    {
        $user = $request->user();

        if ($user === null || ! $user->hasPermission('job.drafting-request.view')) {
            abort(403);
        }

        $allowedStages = [
            DraftingRequest::STAGE_MASTERLIST,
            DraftingRequest::STAGE_APM,
        ];

        if (! in_array($draftingRequest->workflow_stage, $allowedStages, true)
            || $draftingRequest->review_status !== DraftingRequest::REVIEW_ACCEPTED
            || $draftingRequest->isArchived()) {
            abort(404);
        }
    }

    private function authorizeMasterlist(Request $request, DraftingRequest $draftingRequest): void
    {
        $user = $request->user();

        if ($user === null || ! $user->hasPermission('job.drafting-request.view')) {
            abort(403);
        }

        if ($draftingRequest->workflow_stage !== DraftingRequest::STAGE_MASTERLIST
            || $draftingRequest->review_status !== DraftingRequest::REVIEW_ACCEPTED
            || $draftingRequest->isArchived()) {
            abort(404);
        }
    }

    /**
     * @return array{0: string, 1: int, 2: string, 3: string}
     */
    private function resolveListFilters(Request $request): array
    {
        $search = Str::limit(trim((string) $request->input('search', '')), 255);
        $perPage = (int) $request->input('per_page', 25);
        if ($perPage < 5 || $perPage > 50) {
            $perPage = 25;
        }

        $allowedSorts = [
            'lead_number',
            'requested_at',
            'company_name',
            'site_address',
            'status',
        ];
        $sort = (string) $request->input('sort', 'requested_at');
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'requested_at';
        }

        $direction = strtolower((string) $request->input('direction', 'desc'));
        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        return [$search, $perPage, $sort, $direction];
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<DraftingRequest>  $query
     */
    private function applySort($query, string $sort, string $direction): void
    {
        $query->orderBy($sort, $direction)->orderBy('id', $direction);
    }
}
