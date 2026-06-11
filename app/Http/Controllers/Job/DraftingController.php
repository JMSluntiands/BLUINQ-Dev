<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDraftingRequestCommentRequest;
use App\Http\Requests\StoreDraftingRequestFilesRequest;
use App\Http\Requests\StoreDraftingRequestAccountEntryRequest;
use App\Http\Requests\StoreDraftingRequestRevisionRequest;
use App\Http\Requests\UpdateDraftingRequestRequest;
use App\Http\Requests\UpdateDraftingRequestStatusRequest;
use App\Models\BuildingType;
use App\Models\DraftingRequest;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\ServiceEngaging;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestComment;
use App\Models\DraftingRequestFile;
use App\Models\DraftingRequestAccountEntry;
use App\Models\DraftingRequestRevision;
use App\Models\User;
use App\Services\DraftingJobShowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DraftingController extends Controller
{
    private const PRIVATE_DISK = 'local';

    public function __construct(
        private DraftingJobShowService $jobShow,
    ) {}

    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = $this->baseListQuery($request)
            ->active();

        $this->applySearch($query, $search);

        return Inertia::render('Job/Drafting', [
            'draftingRequests' => $query
                ->paginate($perPage)
                ->through(fn (DraftingRequest $row) => $this->formatListRow($row))
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canViewAllRequests' => $request->user()->isAdmin(),
        ]);
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = $this->baseListQuery($request)
            ->archived()
            ->orderByDesc('archived_at');

        $this->applySearch($query, $search);

        return Inertia::render('Job/Drafting/Archive', [
            'draftingRequests' => $query
                ->paginate($perPage)
                ->through(fn (DraftingRequest $row) => [
                    ...$this->formatListRow($row),
                    'archived_at' => $row->archived_at?->toIso8601String(),
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canViewAllRequests' => $request->user()->isAdmin(),
        ]);
    }

    public function show(Request $request, DraftingRequest $draftingRequest): Response
    {
        $this->authorizeView($request, $draftingRequest);

        $draftingRequest->load([
            'buildingType:id,name',
            'externalWallConstruction:id,name',
            'roofType:id,name',
            'serviceEngagings:id,name',
            'files' => fn ($query) => $query->orderBy('kind')->orderBy('id'),
            'user:id,name,email',
            'comments' => fn ($query) => $query
                ->with('user:id,name,profile_image')
                ->orderBy('created_at'),
            'revisions',
            'accountEntries',
        ]);

        $tz = config('app.timezone');
        $listFilters = $this->listFiltersFromRequest($request);
        $user = $request->user();
        $capabilities = $this->jobCapabilities($user, $draftingRequest);
        $active = ! $draftingRequest->isArchived();

        return Inertia::render('Job/Drafting/Show', [
            'draftingRequest' => [
                'id' => $draftingRequest->id,
                'reference' => sprintf('DRF-%05d', $draftingRequest->id),
                'status' => $draftingRequest->status,
                'status_label' => $draftingRequest->statusLabel(),
                'is_archived' => $draftingRequest->isArchived(),
                'archived_at' => $draftingRequest->archived_at?->timezone($tz)->format('d M Y, h:i A'),
                'requested_at' => $draftingRequest->requested_at?->timezone($tz)->format('d M Y, h:i A'),
                'submitted_at' => $draftingRequest->created_at?->timezone($tz)->format('d M Y, h:i A'),
                'your_name' => $draftingRequest->your_name,
                'company_name' => $draftingRequest->company_name,
                'email' => $draftingRequest->email,
                'building_type_id' => $draftingRequest->building_type_id,
                'external_wall_construction_id' => $draftingRequest->external_wall_construction_id,
                'roof_type_id' => $draftingRequest->roof_type_id,
                'service_engaging_ids' => $draftingRequest->serviceEngagings
                    ->pluck('id')
                    ->values()
                    ->all(),
                'site_address' => $draftingRequest->site_address,
                'site_owner_name' => $draftingRequest->site_owner_name,
                'max_building_area_sqm' => $draftingRequest->max_building_area_sqm !== null
                    ? (string) $draftingRequest->max_building_area_sqm
                    : null,
                'design_requirements' => $draftingRequest->design_requirements,
                'building_type' => $draftingRequest->buildingType?->name,
                'ndis_sda' => $draftingRequest->ndis_sda,
                'external_wall_construction' => $draftingRequest->externalWallConstruction?->name,
                'roof_type' => $draftingRequest->roofType?->name,
                'ceiling_heights' => $draftingRequest->ceiling_heights,
                'first_floor_slab' => $draftingRequest->first_floor_slab,
                'additional_inclusions' => $draftingRequest->additional_inclusions,
                'service_engagings' => $draftingRequest->serviceEngagings
                    ->pluck('name')
                    ->values()
                    ->all(),
                'submitted_by' => $draftingRequest->user?->name,
                'files' => $draftingRequest->files->map(fn (DraftingRequestFile $file) => [
                    'id' => $file->id,
                    'kind' => $file->kind,
                    'kind_label' => match ($file->kind) {
                        DraftingRequestFile::KIND_FACADE => 'Facade',
                        DraftingRequestFile::KIND_TEAM => 'Team upload',
                        default => 'Document',
                    },
                    'original_name' => $file->original_name,
                    'mime_type' => $file->mime_type,
                    'size' => $file->size,
                    'size_label' => $this->formatFileSize($file->size),
                    'download_url' => route('job.drafting.files.download', [
                        'draftingRequest' => $draftingRequest->id,
                        'file' => $file->id,
                    ]),
                ])->all(),
                'comments' => $this->formatCommentsByKind(
                    $draftingRequest->comments,
                    DraftingRequestComment::KIND_COMMENT,
                    $tz,
                ),
                'run_comments' => $user->isAdmin()
                    ? $this->formatCommentsByKind(
                        $draftingRequest->comments,
                        DraftingRequestComment::KIND_RUN,
                        $tz,
                    )
                    : [],
                'activities' => $this->formatActivities($draftingRequest, $tz),
                'zoning' => null,
                'building_area_label' => $this->jobShow->formattedBuildingArea($draftingRequest),
                'services_label' => $this->jobShow->formattedServices($draftingRequest),
                'building_specifications' => $this->jobShow->buildingSpecifications($draftingRequest),
            ],
            'revisions' => $capabilities['viewRevision']
                ? $this->jobShow->revisionsFor($draftingRequest)
                : [],
            'quotes' => $capabilities['viewAccounts']
                ? $this->jobShow->quotesFor($draftingRequest)
                : [],
            'invoices' => $capabilities['viewAccounts']
                ? $this->jobShow->invoicesFor($draftingRequest)
                : [],
            'integrationUrls' => $this->jobShow->integrationUrls(),
            'listFilters' => $listFilters,
            'capabilities' => $capabilities,
            'canUseRunComments' => $user->isAdmin(),
            'formOptions' => $capabilities['editJobDetails'] ? [
                'buildingTypes' => BuildingType::query()->active()->orderBy('name')->get(['id', 'name']),
                'serviceEngagings' => ServiceEngaging::query()->active()->orderBy('name')->get(['id', 'name']),
                'externalWallConstructions' => ExternalWallConstruction::query()->active()->orderBy('name')->get(['id', 'name']),
                'roofTypes' => RoofType::query()->active()->orderBy('name')->get(['id', 'name']),
            ] : null,
            'statusOptions' => collect(DraftingRequest::statusOptions())
                ->map(fn (string $label, string $value) => [
                    'value' => $value,
                    'label' => $label,
                ])
                ->values()
                ->all(),
            'drafterUsers' => User::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'initials' => $u->badgeInitials(),
                ])
                ->values()
                ->all(),
        ]);
    }

    public function update(
        UpdateDraftingRequestRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        $section = (string) $request->input('section');

        if ($section === 'building_area') {
            $this->authorizeView($request, $draftingRequest);

            if ($draftingRequest->isArchived()) {
                abort(404);
            }

            if (! $request->user()->hasPermission('job.drafting.building-area.edit')) {
                abort(403);
            }
        } else {
            $this->authorizeJobDetailsEdit($request, $draftingRequest);
        }

        $validated = $request->validated();
        $section = $validated['section'];
        unset($validated['section']);

        $serviceEngagingIds = $validated['service_engaging_ids'] ?? null;
        unset($validated['service_engaging_ids']);

        $draftingRequest->update($validated);

        if ($serviceEngagingIds !== null) {
            $draftingRequest->serviceEngagings()->sync($serviceEngagingIds);
        }

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_DETAILS_UPDATED,
            sprintf('Updated %s.', $this->sectionLabel($section)),
        );

        return redirect()
            ->route('job.drafting.show', [
                'draftingRequest' => $draftingRequest->id,
                ...array_filter($this->listFiltersFromRequest($request)),
            ])
            ->with('status', 'drf-updated');
    }

    public function updateStatus(
        UpdateDraftingRequestStatusRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        $this->authorizeStatusUpdate($request, $draftingRequest);

        $newStatus = $request->validated('status');
        $previousStatus = $draftingRequest->status;

        if ($previousStatus === $newStatus) {
            return redirect()
                ->route('job.drafting.show', [
                    'draftingRequest' => $draftingRequest->id,
                    ...array_filter($this->listFiltersFromRequest($request)),
                ]);
        }

        $draftingRequest->update(['status' => $newStatus]);

        $options = DraftingRequest::statusOptions();
        $fromLabel = $options[$previousStatus]
            ?? ($previousStatus ? ucfirst(str_replace('_', ' ', $previousStatus)) : 'Allocated');
        $toLabel = $options[$newStatus] ?? ucfirst(str_replace('_', ' ', $newStatus));

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_STATUS_CHANGED,
            sprintf('Status changed from %s to %s.', $fromLabel, $toLabel),
        );

        return redirect()
            ->route('job.drafting.show', [
                'draftingRequest' => $draftingRequest->id,
                ...array_filter($this->listFiltersFromRequest($request)),
            ])
            ->with('status', 'drf-status-updated');
    }

    public function destroy(Request $request, DraftingRequest $draftingRequest): RedirectResponse
    {
        $this->authorizeArchive($request, $draftingRequest);

        if ($draftingRequest->isArchived()) {
            return redirect()
                ->route('job.drafting.archive', $this->redirectQuery($request))
                ->with('status', 'drf-already-archived');
        }

        $draftingRequest->forceFill(['archived_at' => now()])->save();

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_ARCHIVED,
            sprintf(
                'Drafting request %s was archived.',
                sprintf('DRF-%05d', $draftingRequest->id),
            ),
        );

        return redirect()
            ->route('job.board', $this->redirectQuery($request))
            ->with('status', 'drf-archived');
    }

    public function restore(Request $request, DraftingRequest $draftingRequest): RedirectResponse
    {
        $this->authorizeArchive($request, $draftingRequest);

        if (! $draftingRequest->isArchived()) {
            return redirect()
                ->route('job.board', $this->redirectQuery($request))
                ->with('status', 'drf-not-archived');
        }

        $draftingRequest->forceFill(['archived_at' => null])->save();

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_RESTORED,
            sprintf(
                'Drafting request %s was restored.',
                sprintf('DRF-%05d', $draftingRequest->id),
            ),
        );

        return redirect()
            ->route('job.drafting.archive', $this->redirectQuery($request))
            ->with('status', 'drf-restored');
    }

    public function storeRevision(
        StoreDraftingRequestRevisionRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        $this->authorizeView($request, $draftingRequest);

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        $validated = $request->validated();

        $drafter = User::query()
            ->active()
            ->findOrFail($validated['drafter_user_id']);

        $revision = DraftingRequestRevision::query()->create([
            'drafting_request_id' => $draftingRequest->id,
            'user_id' => $request->user()->id,
            'code' => trim($validated['code']),
            'log_date' => $validated['log_date'],
            'category' => mb_strtoupper(trim($validated['category'])),
            'drafter_user_id' => $drafter->id,
            'drafter_initials' => $drafter->badgeInitials(),
            'hours' => $validated['hours'] ?? null,
            'submitted_date' => $validated['submitted_date'] ?? null,
        ]);

        $hoursLabel = $revision->hours !== null
            ? rtrim(rtrim((string) $revision->hours, '0'), '.').' hrs'
            : null;

        $description = sprintf(
            'Added revision %s (%s, %s%s).',
            $revision->code,
            $revision->category,
            $drafter->name,
            $hoursLabel ? ', '.$hoursLabel : '',
        );

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_REVISION_ADDED,
            $description,
        );

        return redirect()
            ->route('job.drafting.show', [
                'draftingRequest' => $draftingRequest->id,
                ...array_filter($this->listFiltersFromRequest($request)),
            ])
            ->with('status', 'drf-revision-added');
    }

    public function storeAccountEntry(
        StoreDraftingRequestAccountEntryRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        $this->authorizeView($request, $draftingRequest);

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        $validated = $request->validated();
        $kind = $validated['kind'];

        $entry = DraftingRequestAccountEntry::query()->create([
            'drafting_request_id' => $draftingRequest->id,
            'user_id' => $request->user()->id,
            'kind' => $kind,
            'number' => trim($validated['number']),
            'category' => mb_strtoupper(trim($validated['category'])),
            'rate' => isset($validated['rate']) && $validated['rate'] !== ''
                ? trim($validated['rate'])
                : null,
            'status' => mb_strtoupper(trim($validated['status'])),
        ]);

        $isQuote = $kind === DraftingRequestAccountEntry::KIND_QUOTE;
        $label = $isQuote ? 'quote' : 'invoice';

        $description = sprintf(
            'Added %s %s (%s, %s%s).',
            $label,
            $entry->number,
            $entry->category,
            $entry->status,
            $entry->rate ? ', '.$entry->rate : '',
        );

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            $isQuote
                ? DraftingRequestActivity::ACTION_QUOTE_ADDED
                : DraftingRequestActivity::ACTION_INVOICE_ADDED,
            $description,
        );

        return redirect()
            ->route('job.drafting.show', [
                'draftingRequest' => $draftingRequest->id,
                ...array_filter($this->listFiltersFromRequest($request)),
            ])
            ->with('status', $isQuote ? 'drf-quote-added' : 'drf-invoice-added');
    }

    public function storeComment(
        StoreDraftingRequestCommentRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        $this->authorizeView($request, $draftingRequest);

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        $kind = $request->validated('kind');

        if ($kind === DraftingRequestComment::KIND_RUN) {
            $this->authorizeRunComments($request, $draftingRequest);
        } elseif (! $request->user()->hasPermission('job.drafting.comments.post')) {
            abort(403);
        }

        $body = $request->sanitizedBody();

        DraftingRequestComment::query()->create([
            'drafting_request_id' => $draftingRequest->id,
            'user_id' => $request->user()->id,
            'kind' => $kind,
            'body' => $body,
        ]);

        $isRun = $kind === DraftingRequestComment::KIND_RUN;

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            $isRun
                ? DraftingRequestActivity::ACTION_RUN_COMMENT_POSTED
                : DraftingRequestActivity::ACTION_COMMENT_POSTED,
            $this->commentActivityDescription($body, $isRun),
        );

        return back()->with('status', $isRun ? 'run-comment-added' : 'comment-added');
    }

    public function boardComments(
        Request $request,
        DraftingRequest $draftingRequest,
    ): JsonResponse {
        $this->authorizeView($request, $draftingRequest);

        $tz = config('app.timezone');
        $draftingRequest->load([
            'comments' => fn ($query) => $query
                ->with('user:id,name,profile_image')
                ->where('kind', DraftingRequestComment::KIND_COMMENT)
                ->orderBy('created_at'),
        ]);

        return response()->json([
            'job' => [
                'id' => $draftingRequest->id,
                'reference' => sprintf('DRF-%05d', $draftingRequest->id),
                'site_address' => $draftingRequest->site_address,
            ],
            'comments' => $this->formatCommentsByKind(
                $draftingRequest->comments,
                DraftingRequestComment::KIND_COMMENT,
                $tz,
            ),
        ]);
    }

    public function storeFiles(
        StoreDraftingRequestFilesRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        $this->authorizeFileEdit($request, $draftingRequest);

        $uploaded = 0;

        if ($request->hasFile('facade')) {
            $this->removeFilesByKind($draftingRequest, DraftingRequestFile::KIND_FACADE);
            $this->storeUploadedFile(
                $draftingRequest,
                $request->file('facade'),
                DraftingRequestFile::KIND_FACADE,
                'facade',
            );
            $uploaded++;
        }

        foreach ($request->file('documents', []) as $file) {
            if ($file instanceof UploadedFile && $file->isValid()) {
                $this->storeUploadedFile(
                    $draftingRequest,
                    $file,
                    DraftingRequestFile::KIND_DOCUMENT,
                    'documents',
                );
                $uploaded++;
            }
        }

        foreach ($request->file('team_files', []) as $file) {
            if ($file instanceof UploadedFile && $file->isValid()) {
                $this->storeUploadedFile(
                    $draftingRequest,
                    $file,
                    DraftingRequestFile::KIND_TEAM,
                    'team',
                );
                $uploaded++;
            }
        }

        if ($uploaded === 0) {
            return redirect()
                ->route('job.drafting.show', [
                    'draftingRequest' => $draftingRequest->id,
                    ...array_filter($this->listFiltersFromRequest($request)),
                ]);
        }

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_FILES_UPDATED,
            sprintf(
                'Uploaded %d file%s.',
                $uploaded,
                $uploaded === 1 ? '' : 's',
            ),
        );

        return redirect()
            ->route('job.drafting.show', [
                'draftingRequest' => $draftingRequest->id,
                ...array_filter($this->listFiltersFromRequest($request)),
            ])
            ->with('status', 'drf-files-updated');
    }

    public function destroyFile(
        Request $request,
        DraftingRequest $draftingRequest,
        DraftingRequestFile $file,
    ): RedirectResponse {
        $this->authorizeFileEdit($request, $draftingRequest);

        if ($file->drafting_request_id !== $draftingRequest->id) {
            abort(404);
        }

        $this->deleteStoredFile($file);
        $file->delete();

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_FILES_UPDATED,
            sprintf('Removed file %s.', $file->original_name),
        );

        return redirect()
            ->route('job.drafting.show', [
                'draftingRequest' => $draftingRequest->id,
                ...array_filter($this->listFiltersFromRequest($request)),
            ])
            ->with('status', 'drf-files-updated');
    }

    public function downloadFile(
        Request $request,
        DraftingRequest $draftingRequest,
        DraftingRequestFile $file,
    ): StreamedResponse {
        $this->authorizeView($request, $draftingRequest);

        if (! $request->user()->hasPermission('job.drafting.files.view')) {
            abort(403);
        }

        if ($file->drafting_request_id !== $draftingRequest->id) {
            abort(404);
        }

        if (! Storage::disk($file->disk)->exists($file->path)) {
            abort(404);
        }

        return Storage::disk($file->disk)->download(
            $file->path,
            $file->original_name,
        );
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<DraftingRequest>
     */
    private function baseListQuery(Request $request)
    {
        $user = $request->user();

        $query = DraftingRequest::query()
            ->with([
                'buildingType:id,name',
                'serviceEngagings:id,name',
            ])
            ->withCount('files')
            ->orderByDesc('requested_at')
            ->orderByDesc('id');

        if (! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query;
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

    /**
     * @return array<string, mixed>
     */
    private function formatListRow(DraftingRequest $row): array
    {
        return [
            'id' => $row->id,
            'reference' => sprintf('DRF-%05d', $row->id),
            'requested_at' => $row->requested_at?->timezone(config('app.timezone'))->format('d M Y, h:i A'),
            'your_name' => $row->your_name,
            'company_name' => $row->company_name,
            'site_address' => $row->site_address,
            'building_type' => $row->buildingType?->name,
            'services' => $row->serviceEngagings->pluck('name')->join(', '),
            'files_count' => $row->files_count,
            'ndis_sda' => $row->ndis_sda,
            'status' => $row->status,
            'status_label' => $row->statusLabel(),
        ];
    }

    private function authorizeView(Request $request, DraftingRequest $draftingRequest): void
    {
        $user = $request->user();

        if ($user === null || ! $this->userCanViewDraftingRequest($user, $draftingRequest)) {
            abort(403);
        }
    }

    private function authorizeArchive(
        Request $request,
        DraftingRequest $draftingRequest,
    ): void {
        $this->authorizeView($request, $draftingRequest);

        if (! $request->user()->hasPermission('job.drafting.archive')) {
            abort(403);
        }
    }

    private function authorizeJobDetailsEdit(
        Request $request,
        DraftingRequest $draftingRequest,
    ): void {
        $this->authorizeView($request, $draftingRequest);

        if (! $request->user()->hasPermission('job.drafting.job-details.edit')) {
            abort(403);
        }

        if ($draftingRequest->isArchived()) {
            abort(404);
        }
    }

    private function authorizeFileEdit(
        Request $request,
        DraftingRequest $draftingRequest,
    ): void {
        $this->authorizeView($request, $draftingRequest);

        if (! $request->user()->hasPermission('job.drafting.files.edit')) {
            abort(403);
        }

        if ($draftingRequest->isArchived()) {
            abort(404);
        }
    }

    private function authorizeStatusUpdate(
        Request $request,
        DraftingRequest $draftingRequest,
    ): void {
        $this->authorizeJobDetailsEdit($request, $draftingRequest);
    }

    /**
     * @return array<string, bool>
     */
    private function jobCapabilities(User $user, DraftingRequest $draftingRequest): array
    {
        $canView = $this->userCanViewDraftingRequest($user, $draftingRequest);
        $active = ! $draftingRequest->isArchived();

        return [
            'editJobDetails' => $canView && $active && $user->hasPermission('job.drafting.job-details.edit'),
            'editBuildingArea' => $canView && $active && $user->hasPermission('job.drafting.building-area.edit'),
            'editStatus' => $canView && $active && $user->hasPermission('job.drafting.job-details.edit'),
            'archive' => $canView && $user->hasPermission('job.drafting.archive'),
            'viewRevision' => $canView && $user->hasPermission('job.drafting.revision.view'),
            'addRevision' => $canView && $active && $user->hasPermission('job.drafting.revision.add'),
            'viewAccounts' => $canView && $user->hasPermission('job.drafting.accounts.view'),
            'addAccount' => $canView && $active && $user->hasPermission('job.drafting.accounts.add'),
            'viewFiles' => $canView && $user->hasPermission('job.drafting.files.view'),
            'editFiles' => $canView && $active && $user->hasPermission('job.drafting.files.edit'),
            'viewComments' => $canView && $user->hasPermission('job.drafting.comments.view'),
            'postComments' => $canView && $active && $user->hasPermission('job.drafting.comments.post'),
            'viewActivity' => $canView && $user->hasPermission('job.drafting.activity.view'),
        ];
    }

    private function userCanViewDraftingRequest(
        User $user,
        DraftingRequest $draftingRequest,
    ): bool {
        if (! $user->hasPermission('job.drafting.view')) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return $draftingRequest->user_id === $user->id;
    }

    private function authorizeRunComments(
        Request $request,
        DraftingRequest $draftingRequest,
    ): void {
        $this->authorizeView($request, $draftingRequest);

        if (! $request->user()->isAdmin()) {
            abort(403);
        }

        if ($draftingRequest->isArchived()) {
            abort(404);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function redirectQuery(Request $request): array
    {
        return array_filter($this->listFiltersFromRequest($request));
    }

    /**
     * @return array{search: string, per_page: int|null, from: string|null}
     */
    private function listFiltersFromRequest(Request $request): array
    {
        $perPage = $request->query('per_page');

        return [
            'search' => Str::limit(trim((string) $request->query('search', '')), 255),
            'per_page' => $perPage !== null && $perPage !== ''
                ? (int) $perPage
                : null,
            'from' => $request->query('from') === 'archive' ? 'archive' : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatComment(DraftingRequestComment $comment, string $tz): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'author_name' => $comment->user?->name ?? 'Unknown',
            'author_profile_image_url' => $comment->user?->profile_image_url,
            'created_at' => $comment->created_at?->timezone($tz)->format('d M Y, h:i A'),
            'is_mine' => $comment->user_id === auth()->id(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function formatActivities(DraftingRequest $draftingRequest, string $tz): array
    {
        return DraftingRequestActivity::query()
            ->where('drafting_request_id', $draftingRequest->id)
            ->with('user:id,name,profile_image')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (DraftingRequestActivity $activity) => $this->formatActivity($activity, $tz))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatActivity(DraftingRequestActivity $activity, string $tz): array
    {
        return [
            'id' => $activity->id,
            'action' => $activity->action,
            'action_label' => match ($activity->action) {
                DraftingRequestActivity::ACTION_REQUEST_SUBMITTED => 'Submitted drafting request',
                DraftingRequestActivity::ACTION_COMMENT_POSTED => 'Posted a comment',
                DraftingRequestActivity::ACTION_RUN_COMMENT_POSTED => 'Posted a run comment',
                DraftingRequestActivity::ACTION_ARCHIVED => 'Archived drafting request',
                DraftingRequestActivity::ACTION_RESTORED => 'Restored drafting request',
                DraftingRequestActivity::ACTION_STATUS_CHANGED => 'Changed status',
                DraftingRequestActivity::ACTION_DETAILS_UPDATED => 'Updated details',
                DraftingRequestActivity::ACTION_FILES_UPDATED => 'Updated files',
                DraftingRequestActivity::ACTION_REVISION_ADDED => 'Added revision',
                DraftingRequestActivity::ACTION_QUOTE_ADDED => 'Added quote',
                DraftingRequestActivity::ACTION_INVOICE_ADDED => 'Added invoice',
                default => 'Activity',
            },
            'description' => $activity->description,
            'user_name' => $activity->user?->name ?? 'Unknown',
            'user_profile_image_url' => $activity->user?->profile_image_url,
            'created_at' => $activity->created_at?->timezone($tz)->format('d M Y, h:i A'),
            'is_mine' => $activity->user_id === auth()->id(),
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, DraftingRequestComment>  $comments
     * @return list<array<string, mixed>>
     */
    private function formatCommentsByKind($comments, string $kind, string $tz): array
    {
        return $comments
            ->where('kind', $kind)
            ->map(fn (DraftingRequestComment $comment) => $this->formatComment($comment, $tz))
            ->values()
            ->all();
    }

    private function commentActivityDescription(string $body, bool $isRun = false): string
    {
        $text = trim(strip_tags($body));

        if ($text === '') {
            return $isRun
                ? 'Added a run comment with rich text only.'
                : 'Added a comment with rich text only.';
        }

        $prefix = $isRun ? 'Run comment: ' : '';

        return $prefix.Str::limit($text, 200);
    }

    private function formatFileSize(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }

        if ($bytes < 1024 * 1024) {
            return round($bytes / 1024, 1).' KB';
        }

        return round($bytes / (1024 * 1024), 1).' MB';
    }

    private function storeUploadedFile(
        DraftingRequest $draftingRequest,
        UploadedFile $file,
        string $kind,
        string $directory,
    ): void {
        $path = $file->store(
            'drafting-requests/'.$draftingRequest->id.'/'.$directory,
            self::PRIVATE_DISK,
        );

        $draftingRequest->files()->create([
            'kind' => $kind,
            'disk' => self::PRIVATE_DISK,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize() ?: 0,
        ]);
    }

    private function removeFilesByKind(DraftingRequest $draftingRequest, string $kind): void
    {
        $draftingRequest->files()
            ->where('kind', $kind)
            ->get()
            ->each(function (DraftingRequestFile $file) {
                $this->deleteStoredFile($file);
                $file->delete();
            });
    }

    private function deleteStoredFile(DraftingRequestFile $file): void
    {
        if (Storage::disk($file->disk)->exists($file->path)) {
            Storage::disk($file->disk)->delete($file->path);
        }
    }

    private function sectionLabel(string $section): string
    {
        return match ($section) {
            'client' => 'client details',
            'job' => 'job details',
            'building' => 'building specifications',
            'notes' => 'notes',
            'building_area' => 'building area',
            default => 'details',
        };
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
}
