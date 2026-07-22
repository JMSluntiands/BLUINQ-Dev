<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDraftingRequestFormRequest;
use App\Models\BuildingType;
use App\Models\DraftingRequest;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\ServiceEngaging;
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
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = DraftingRequest::query()
            ->with([
                'buildingType:id,name',
                'serviceEngagings:id,name',
                'assignments' => fn ($relation) => $relation
                    ->with('user:id,name')
                    ->orderBy('role')
                    ->orderBy('slot'),
                'revisions' => fn ($relation) => $relation
                    ->with(['drafter:id,name', 'checker:id,name'])
                    ->orderByDesc('log_date')
                    ->orderByDesc('id'),
                'accountEntries' => fn ($relation) => $relation->orderByDesc('id'),
            ])
            ->withCount(['files', 'comments'])
            ->masterlist()
            ->reviewAccepted()
            ->active()
            ->orderByDesc('requested_at')
            ->orderByDesc('id');

        $user = $request->user();
        if ($user !== null && ! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        $this->applySearch($query, $search);

        return Inertia::render('Job/Masterlist/Index', [
            'draftingRequests' => $query
                ->paginate($perPage)
                ->through(fn (DraftingRequest $row) => $this->board->formatBoardRow($row))
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canForwardToApm' => $user?->hasPermission('job.masterlist.forward') ?? false,
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
        $this->authorizeMasterlist($request, $draftingRequest);

        return $this->drafting->renderJobShow($request, $draftingRequest, [
            'from' => 'masterlist',
        ]);
    }

    public function edit(Request $request, DraftingRequest $draftingRequest): Response
    {
        $this->authorizeMasterlist($request, $draftingRequest);

        $tz = config('app.timezone');
        $requestedAt = $draftingRequest->requested_at
            ? $draftingRequest->requested_at->timezone($tz)->seconds(0)->format('Y-m-d\TH:i')
            : now($tz)->seconds(0)->format('Y-m-d\TH:i');

        return Inertia::render('Job/DraftingRequestForm', [
            'standalone' => false,
            'submitted' => false,
            'mode' => 'edit',
            'submitUrl' => route('job.masterlist.update', $draftingRequest),
            'backUrl' => route('job.masterlist'),
            'formTitle' => 'Edit masterlist entry',
            'applicant' => [
                'id' => $draftingRequest->id,
                'requested_at' => $requestedAt,
                'your_name' => $draftingRequest->your_name,
                'company_name' => $draftingRequest->company_name,
                'email' => $draftingRequest->email,
                'service_engaging_ids' => $draftingRequest->serviceEngagings()->pluck('service_engagings.id')->all(),
                'site_address' => $draftingRequest->site_address,
                'site_owner_name' => $draftingRequest->site_owner_name,
                'max_building_area_sqm' => $draftingRequest->max_building_area_sqm,
                'design_requirements' => $draftingRequest->design_requirements,
                'building_type_id' => $draftingRequest->building_type_id,
                'zoning' => $draftingRequest->zoning,
                'ndis_sda' => (bool) $draftingRequest->ndis_sda,
                'external_wall_construction_id' => $draftingRequest->external_wall_construction_id,
                'roof_type_id' => $draftingRequest->roof_type_id,
                'ceiling_heights' => $draftingRequest->ceiling_heights,
                'first_floor_slab' => $draftingRequest->first_floor_slab,
                'additional_inclusions' => $draftingRequest->additional_inclusions,
            ],
            ...$this->formOptions(),
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
            $request->user()?->hasPermission('job.masterlist.forward'),
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
     * @return array{
     *     serviceEngagings: \Illuminate\Support\Collection,
     *     buildingTypes: \Illuminate\Support\Collection,
     *     externalWallConstructions: \Illuminate\Support\Collection,
     *     roofTypes: \Illuminate\Support\Collection
     * }
     */
    private function formOptions(): array
    {
        return [
            'serviceEngagings' => ServiceEngaging::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
            'buildingTypes' => BuildingType::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
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

    private function authorizeMasterlist(Request $request, DraftingRequest $draftingRequest): void
    {
        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        if ($draftingRequest->workflow_stage !== DraftingRequest::STAGE_MASTERLIST
            || $draftingRequest->review_status !== DraftingRequest::REVIEW_ACCEPTED
            || $draftingRequest->isArchived()) {
            abort(404);
        }

        if (! $user->isAdmin() && $draftingRequest->user_id !== $user->id) {
            abort(403);
        }
    }

    /**
     * @return array{0: string, 1: int}
     */
    private function resolveListFilters(Request $request): array
    {
        $search = Str::limit(trim((string) $request->input('search', '')), 255);
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 5 || $perPage > 50) {
            $perPage = 10;
        }

        return [$search, $perPage];
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<DraftingRequest>  $query
     */
    private function applySearch($query, string $search): void
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
}
