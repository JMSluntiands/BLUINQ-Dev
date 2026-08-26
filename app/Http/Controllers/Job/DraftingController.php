<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDraftingRequestCommentRequest;
use App\Http\Requests\StoreDraftingRequestFilesRequest;
use App\Http\Requests\StoreDraftingRequestAccountEntryRequest;
use App\Http\Requests\UpdateDraftingRequestAccountEntryRequest;
use App\Http\Requests\StoreDraftingRequestRevisionRequest;
use App\Http\Requests\UpdateDraftingRequestRevisionRequest;
use App\Http\Requests\UpdateDraftingRequestRequest;
use App\Http\Requests\UpdateDraftingRequestStatusRequest;
use App\Models\ClientContact;
use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\StoreyLevel;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestComment;
use App\Models\DraftingRequestFile;
use App\Models\DraftingRequestAccountEntry;
use App\Models\DraftingRequestRevision;
use App\Models\DraftingRequestUnit;
use App\Models\User;
use App\Services\DraftingJobShowService;
use App\Services\DraftingRequestBoardService;
use App\Services\DraftingRequestSubmissionService;
use App\Services\TimesheetDraftingHoursSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
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
        private DraftingRequestBoardService $board,
        private TimesheetDraftingHoursSyncService $timesheetSync,
        private DraftingRequestSubmissionService $submission,
    ) {}

    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = $this->baseListQuery($request)
            ->active();

        $this->board->applySearch($query, $search);

        return Inertia::render('Job/Drafting', [
            'draftingRequests' => $query
                ->paginate($perPage)
                ->through(fn (DraftingRequest $row) => $this->formatListRow($row))
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canViewAllRequests' => $request->user()->hasPermission('job.list.view'),
        ]);
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = DraftingRequest::query()
            ->with([
                'buildingType:id,name',
                'serviceEngagings:id,name',
            ])
            ->withCount('files')
            ->archived()
            ->orderByDesc('archived_at')
            ->orderByDesc('id');

        $this->board->applySearch($query, $search);

        return Inertia::render('Job/Drafting/Archive', [
            'draftingRequests' => $query
                ->paginate($perPage)
                ->through(fn (DraftingRequest $row) => [
                    ...$this->formatListRow($row),
                    'archived_at' => $row->archived_at?->toIso8601String(),
                    'workflow_stage' => $row->workflow_stage,
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canViewAllRequests' => $request->user()->hasPermission('job.list.view'),
        ]);
    }

    public function show(Request $request, DraftingRequest $draftingRequest): Response|RedirectResponse
    {
        $this->authorizeView($request, $draftingRequest);

        return $this->renderJobShow($request, $draftingRequest);
    }

    /**
     * Shared job show page (Drafting APM + Masterlist).
     *
     * @param  array{search?: string, per_page?: int|null, from?: string|null}  $listFilterOverrides
     */
    public function renderJobShow(
        Request $request,
        DraftingRequest $draftingRequest,
        array $listFilterOverrides = [],
    ): Response|RedirectResponse {
        if (
            ! $draftingRequest->isArchived()
            && $draftingRequest->isOnProjectBoard()
            && ! $draftingRequest->revisions()->exists()
        ) {
            $this->submission->returnToMasterlistIfNoRevisions(
                $draftingRequest,
                $request->user(),
            );

            return redirect()
                ->route('job.list', $this->redirectQuery($request))
                ->with('status', 'drf-revision-deleted-returned-to-masterlist');
        }

        $draftingRequest->load([
            'buildingType:id,name',
            'buildingClass:id,name,code',
            'storeyLevel:id,name,code',
            'crmCategory:id,name,code',
            'crmCategories:id,name,code',
            'clientContact:id,client_id,name,email,mobile',
            'externalWallConstruction:id,name',
            'roofType:id,name',
            'serviceEngagings:id,name',
            'sdaTypes:id,name,code',
            'units',
            'files' => fn ($query) => $query->orderBy('kind')->orderBy('id'),
            'user:id,name,email',
            'manager:id,name,email',
            'comments' => fn ($query) => $query
                ->with([
                    'user:id,name,initials,profile_image',
                    'revision:id,drafting_request_id,code',
                ])
                ->orderBy('created_at'),
            'revisions',
            'accountEntries',
        ]);

        $tz = config('app.timezone');
        $listFilters = array_merge($this->listFiltersFromRequest($request), $listFilterOverrides);
        $user = $request->user();
        $capabilities = $this->jobCapabilities($user, $draftingRequest);

        return Inertia::render('Job/Drafting/Show', [
            'draftingRequest' => [
                'id' => $draftingRequest->id,
                'reference' => $draftingRequest->jobNumber(),
                'latest_revision' => $draftingRequest->latestRevisionCode(),
                'lead_number' => $draftingRequest->lead_number ?: $draftingRequest->jobNumber(),
                'status' => $draftingRequest->status,
                'status_label' => $draftingRequest->statusLabel(),
                'is_archived' => $draftingRequest->isArchived(),
                'archived_at' => $draftingRequest->archived_at?->timezone($tz)->format('d M Y, h:i A'),
                'requested_at' => $draftingRequest->requested_at?->timezone($tz)->format('d M Y, h:i A'),
                'submitted_at' => $draftingRequest->created_at?->timezone($tz)->format('d M Y, h:i A'),
                'your_name' => $draftingRequest->your_name,
                'company_name' => $draftingRequest->company_name,
                'email' => $draftingRequest->email,
                'phone' => $draftingRequest->phone,
                'client_id' => $draftingRequest->client_id,
                'client_contact_id' => $draftingRequest->client_contact_id,
                'client_contact_name' => $draftingRequest->clientContact?->name,
                'client_contact_email' => $draftingRequest->clientContact?->email,
                'client_contact_phone' => $draftingRequest->clientContact?->mobile,
                'manager_user_id' => $draftingRequest->manager_user_id,
                'manager_name' => $draftingRequest->manager?->name,
                'manager_email' => $draftingRequest->manager?->email,
                'building_type_id' => $draftingRequest->building_type_id,
                'storey_level_id' => $draftingRequest->storey_level_id,
                'crm_category_id' => $draftingRequest->crm_category_id,
                'crm_category_ids' => ($draftingRequest->crmCategories->isNotEmpty()
                    ? $draftingRequest->crmCategories->pluck('id')
                    : collect([$draftingRequest->crm_category_id])->filter())
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all(),
                'external_wall_construction_id' => $draftingRequest->external_wall_construction_id,
                'roof_type_id' => $draftingRequest->roof_type_id,
                'service_engaging_ids' => $draftingRequest->serviceEngagings
                    ->pluck('id')
                    ->values()
                    ->all(),
                'site_address' => $draftingRequest->site_address,
                'council_shire' => $draftingRequest->council_shire,
                'site_owner_name' => $draftingRequest->site_owner_name,
                'max_building_area_sqm' => $draftingRequest->max_building_area_sqm !== null
                    ? (string) $draftingRequest->max_building_area_sqm
                    : null,
                'design_requirements' => $draftingRequest->design_requirements,
                'building_type' => $draftingRequest->buildingType?->name,
                'storey_level' => $draftingRequest->storeyLevel
                    ? ($draftingRequest->storeyLevel->code
                        ? "{$draftingRequest->storeyLevel->code} — {$draftingRequest->storeyLevel->name}"
                        : $draftingRequest->storeyLevel->name)
                    : null,
                'crm_category' => $draftingRequest->crmCategories->isNotEmpty()
                    ? $draftingRequest->crmCategories
                        ->map(fn ($row) => $row->code ? "{$row->code} — {$row->name}" : $row->name)
                        ->join(', ')
                    : ($draftingRequest->crmCategory
                        ? ($draftingRequest->crmCategory->code
                            ? "{$draftingRequest->crmCategory->code} — {$draftingRequest->crmCategory->name}"
                            : $draftingRequest->crmCategory->name)
                        : null),
                'building_class' => $draftingRequest->buildingClass
                    ? ($draftingRequest->buildingClass->displayCode()
                        ? "{$draftingRequest->buildingClass->displayCode()} — {$draftingRequest->buildingClass->name}"
                        : $draftingRequest->buildingClass->name)
                    : null,
                'ndis_sda' => $draftingRequest->ndis_sda,
                'sda_types' => $draftingRequest->sdaTypes
                    ->map(fn ($row) => $row->code ? "{$row->code} — {$row->name}" : $row->name)
                    ->values()
                    ->all(),
                'unit_development_count' => (int) ($draftingRequest->unit_development_count ?? 0),
                'units' => $draftingRequest->units
                    ->map(fn (DraftingRequestUnit $unit) => [
                        'id' => $unit->id,
                        'unit_number' => $unit->unit_number,
                        'house_type' => $unit->house_type,
                        'area_sqm' => $unit->area_sqm !== null
                            ? rtrim(rtrim((string) $unit->area_sqm, '0'), '.')
                            : null,
                    ])
                    ->values()
                    ->all(),
                'drawing_checklist' => $draftingRequest->resolvedDrawingChecklist(),
                'external_wall_construction' => $draftingRequest->externalWallConstruction?->name,
                'construction' => $draftingRequest->externalWallConstruction?->name,
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
                    'view_url' => route('job.drafting.files.view', [
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
                'zoning' => $draftingRequest->zoning,
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
                'clients' => \App\Support\ClientFormOptions::forForms($draftingRequest->client_id),
                'categories' => CrmCategory::query()->active()->orderBy('code')->orderBy('name')->get(['id', 'name', 'code']),
                'storeyLevels' => StoreyLevel::query()->active()->orderBy('code')->orderBy('name')->get(['id', 'name', 'code']),
                'externalWallConstructions' => ExternalWallConstruction::query()->active()->orderBy('name')->get(['id', 'name']),
                'roofTypes' => RoofType::query()->active()->orderBy('name')->get(['id', 'name']),
                'managerUsers' => User::query()
                    ->active()
                    ->whereHas('role', fn ($query) => $query->whereIn('slug', ['admin', 'project-manager']))
                    ->orderBy('name')
                    ->get(['id', 'name', 'email'])
                    ->map(fn (User $u) => [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                    ])
                    ->values()
                    ->all(),
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
                ->get(['id', 'name', 'initials'])
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'initials' => $u->badgeInitials(),
                ])
                ->values()
                ->all(),
            'accountStatusOptions' => [
                'quote' => DraftingRequestAccountEntry::quoteStatusOptions(),
                'invoice' => DraftingRequestAccountEntry::invoiceStatusOptions(),
            ],
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
            'projectOptions' => $capabilities['addFromMasterlist']
                ? $this->masterlistCandidatesForShow($user)
                : [],
        ]);
    }

    /**
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
    private function masterlistCandidatesForShow(User $user): array
    {
        $statusLabels = DraftingRequest::statusLabels();
        $revisionRelations = [
            'revisions' => fn ($query) => $query
                ->orderBy('id')
                ->select('id', 'drafting_request_id', 'code'),
        ];

        $format = function ($rows, string $source) use ($statusLabels): array {
            return $rows->map(function (DraftingRequest $row) use ($source, $statusLabels) {
                $row->loadMissing([
                    'revisions' => fn ($query) => $query
                        ->orderBy('id')
                        ->select('id', 'drafting_request_id', 'code'),
                ]);

                $leadNo = $row->jobNumber();
                $client = $row->company_name ?: ($row->your_name ?: '—');
                $job    = $row->site_address ?: '—';
                $status = $row->status ?? DraftingRequest::STATUS_NEW;

                if ($source === 'apm') {
                    $statusLabel = $statusLabels[$status] ?? ucfirst(str_replace('_', ' ', $status));
                    $label = "[APM] {$leadNo} — {$client} — {$job} · {$statusLabel}";
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
                    'id'             => $row->id,
                    'value'          => (string) $row->id,
                    'lead_no'        => $leadNo,
                    'label'          => $label,
                    'source'         => $source,
                    'status'         => $status,
                    'revisions'      => $revisions,
                    'suggested_code' => $row->suggestNextRevisionCode(),
                    'latest_revision'=> $latestRevision,
                ];
            })->values()->all();
        };

        $byId = [];

        // Add item should only list masterlist rows — not jobs already on the board.
        foreach ($format(
            DraftingRequest::query()->masterlist()->reviewAccepted()->active()
                ->with($revisionRelations)
                ->orderByDesc('requested_at')->orderByDesc('id')->get(),
            'masterlist',
        ) as $row) {
            $byId[$row['id']] = $row;
        }

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

            $user = $request->user();
            $masterlistOk = $draftingRequest->workflow_stage === DraftingRequest::STAGE_MASTERLIST
                && $user->hasPermission('job.drafting-request.view');

            if (! $user->hasPermission('job.drafting.building-area.edit') && ! $masterlistOk) {
                abort(403);
            }
        } else {
            $this->authorizeJobDetailsEdit($request, $draftingRequest);
        }

        $validated = $request->validated();
        $section = $validated['section'];
        unset($validated['section']);

        if ($section === 'drawing_checklist_reset') {
            $draftingRequest->update([
                'drawing_checklist' => array_map(
                    function (array $item) {
                        $row = [
                            'key' => $item['key'],
                            'label' => $item['label'],
                            'checked' => false,
                        ];

                        if ($item['key'] === 'others') {
                            $row['custom_type'] = '';
                        }

                        return $row;
                    },
                    DraftingRequest::defaultDrawingChecklist(),
                ),
            ]);

            DraftingRequestActivity::record(
                $draftingRequest,
                $request->user(),
                DraftingRequestActivity::ACTION_DRAWING_CHECKLIST_RESET,
                'Reset drawing status checklist.',
            );

            return redirect()
                ->route($this->jobShowRouteName($request), $this->jobShowRouteParams($draftingRequest, $request))
                ->with('status', 'drf-updated');
        }

        if ($section === 'drawing_checklist') {
            $defaults = collect(DraftingRequest::defaultDrawingChecklist())
                ->keyBy('key');
            $incoming = collect($validated['items'] ?? [])
                ->keyBy('key');

            $checklist = $defaults
                ->map(function (array $item, string $key) use ($incoming) {
                    $incomingItem = $incoming->get($key) ?? [];
                    $checked = (bool) ($incomingItem['checked'] ?? false);
                    $row = [
                        'key' => $key,
                        'label' => $item['label'],
                        'checked' => $checked,
                    ];

                    if ($key === 'others') {
                        $row['custom_type'] = $checked
                            ? trim((string) ($incomingItem['custom_type'] ?? ''))
                            : '';
                    }

                    return $row;
                })
                ->values()
                ->all();

            $draftingRequest->update(['drawing_checklist' => $checklist]);

            DraftingRequestActivity::record(
                $draftingRequest,
                $request->user(),
                DraftingRequestActivity::ACTION_DRAWING_CHECKLIST_UPDATED,
                'Updated drawing status checklist.',
            );

            return redirect()
                ->route($this->jobShowRouteName($request), $this->jobShowRouteParams($draftingRequest, $request))
                ->with('status', 'drf-updated');
        }

        $serviceEngagingIds = $validated['service_engaging_ids'] ?? null;
        unset($validated['service_engaging_ids']);

        $crmCategoryIds = $validated['crm_category_ids'] ?? null;
        unset($validated['crm_category_ids']);

        $units = $validated['units'] ?? null;
        unset($validated['units']);

        $clientId = array_key_exists('client_id', $validated)
            ? (int) ($validated['client_id'] ?: 0)
            : null;
        $clientContactId = array_key_exists('client_contact_id', $validated)
            ? (int) ($validated['client_contact_id'] ?: 0)
            : null;

        $previousLead = $section === 'job' && array_key_exists('lead_number', $validated)
            ? $draftingRequest->jobNumber()
            : null;

        if ($section === 'job') {
            if ($clientId !== null && $clientId <= 0) {
                $validated['client_id'] = null;
                $validated['client_contact_id'] = null;
                $validated['company_name'] = '';
                $validated['your_name'] = '';
                $validated['email'] = '';
                $validated['phone'] = '';
            } else {
                if ($clientContactId > 0) {
                    $contact = ClientContact::query()
                        ->whereKey($clientContactId)
                        ->when(
                            $clientId > 0,
                            fn ($query) => $query->where('client_id', $clientId),
                        )
                        ->first();

                    if ($contact !== null) {
                        $validated['client_id'] = $contact->client_id;
                        $validated['client_contact_id'] = $contact->id;
                        $validated['your_name'] = $contact->name ?? '';
                        $validated['email'] = $contact->email ?? '';
                        $validated['phone'] = $contact->mobile ?? '';
                    }
                } else {
                    $validated['client_contact_id'] = null;
                    $validated['your_name'] = '';
                    $validated['email'] = '';
                    $validated['phone'] = '';
                }

                if (($validated['client_id'] ?? null) !== null) {
                    $clientName = \App\Models\Client::query()
                        ->whereKey($validated['client_id'])
                        ->value('name');

                    if ($clientName !== null) {
                        $validated['company_name'] = $clientName;
                    }
                }
            }
        }

        $draftingRequest->update($validated);

        if ($previousLead !== null) {
            $newLead = trim((string) $validated['lead_number']);
            if ($newLead !== '' && $newLead !== $previousLead) {
                $draftingRequest->rebaseRevisionCodes($previousLead, $newLead);
            }
        }

        if ($serviceEngagingIds !== null) {
            $draftingRequest->serviceEngagings()->sync($serviceEngagingIds);
        }

        if ($crmCategoryIds !== null) {
            $draftingRequest->crmCategories()->sync($crmCategoryIds);
        }

        if ($section === 'job' && $units !== null) {
            $this->syncUnits(
                $draftingRequest,
                (int) ($validated['unit_development_count'] ?? 0),
                $units,
            );
        } elseif ($section === 'job' && array_key_exists('unit_development_count', $validated)) {
            $this->syncUnits(
                $draftingRequest,
                (int) $validated['unit_development_count'],
                [],
            );
        }

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_DETAILS_UPDATED,
            sprintf('Updated %s.', $this->sectionLabel($section)),
        );

        return redirect()
            ->route($this->jobShowRouteName($request), $this->jobShowRouteParams($draftingRequest, $request))
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
                ->route($this->jobShowRouteName($request), $this->jobShowRouteParams($draftingRequest, $request));
        }

        $draftingRequest->update(['status' => $newStatus]);

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

        return redirect()
            ->route($this->jobShowRouteName($request), $this->jobShowRouteParams($draftingRequest, $request))
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
                $draftingRequest->jobNumber(),
            ),
        );

        if ($this->listFiltersFromRequest($request)['from'] === 'masterlist') {
            return redirect()
                ->route('job.masterlist', $this->redirectQuery($request))
                ->with('status', 'drf-archived');
        }

        return redirect()
            ->route('job.list', $this->redirectQuery($request))
            ->with('status', 'drf-archived');
    }

    public function restore(Request $request, DraftingRequest $draftingRequest): RedirectResponse
    {
        $this->authorizeArchive($request, $draftingRequest);

        if (! $draftingRequest->isArchived()) {
            return redirect()
                ->route('job.list', $this->redirectQuery($request))
                ->with('status', 'drf-not-archived');
        }

        $draftingRequest->forceFill(['archived_at' => null])->save();

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_RESTORED,
            sprintf(
                'Drafting request %s was restored.',
                $draftingRequest->jobNumber(),
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

        $drafter = null;
        if (! empty($validated['drafter_user_id'])) {
            $drafter = User::query()
                ->active()
                ->findOrFail($validated['drafter_user_id']);
        }

        $checker = null;
        if (! empty($validated['checker_user_id'])) {
            $checker = User::query()
                ->active()
                ->findOrFail($validated['checker_user_id']);
        }

        $revision = DraftingRequestRevision::query()->create([
            'drafting_request_id' => $draftingRequest->id,
            'user_id' => $request->user()->id,
            'code' => $this->normalizeRevisionCode(
                $draftingRequest,
                trim($validated['code']),
            ),
            'link' => isset($validated['link']) && $validated['link'] !== ''
                ? \App\Support\PublicUrl::rewriteLocalhost(trim($validated['link']))
                : null,
            'log_date' => $validated['log_date'],
            'category' => trim($validated['category']),
            'drafter_user_id' => $drafter?->id,
            'drafter_initials' => $drafter?->badgeInitials(),
            'checker_user_id' => $checker?->id,
            'checker_initials' => $checker?->badgeInitials(),
            'drafting_hours' => $validated['drafting_hours'] ?? null,
            'checking_hours' => $validated['checking_hours'] ?? null,
            'status' => $validated['status'],
            'area_size' => isset($validated['area_size']) && $validated['area_size'] !== ''
                ? trim($validated['area_size'])
                : null,
            'submitted_date' => $validated['submitted_date'] ?? null,
        ]);

        $hoursLabel = $this->formatRevisionHoursLabel(
            $revision->drafting_hours,
            $revision->checking_hours,
        );

        $people = $drafter
            ? $drafter->name.($checker ? ' / '.$checker->name : '')
            : ($checker?->name ?? 'unassigned');

        $description = sprintf(
            'Added revision %s (%s, %s%s).',
            $revision->code,
            $revision->category,
            $people,
            $hoursLabel ? ', '.$hoursLabel : '',
        );

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_REVISION_ADDED,
            $description,
        );

        $this->syncJobStatusFromRevision(
            $draftingRequest,
            $request->user(),
            $validated['status'],
        );
        $this->syncJobCategoryFromSelection(
            $draftingRequest,
            $revision->category,
        );

        $this->board->syncRevisionHoursToAssignments($draftingRequest, $revision);
        $this->timesheetSync->syncRevisionToTimesheet($revision->fresh());

        return back()->with('status', 'drf-revision-added');
    }

    public function updateRevision(
        UpdateDraftingRequestRevisionRequest $request,
        DraftingRequest $draftingRequest,
        DraftingRequestRevision $revision,
    ): RedirectResponse {
        $validated = $request->validated();

        $updates = [
            'code' => $this->normalizeRevisionCode(
                $draftingRequest,
                trim($validated['code']),
            ),
            'log_date' => $validated['log_date'],
            'category' => trim($validated['category']),
            'status' => $validated['status'],
        ];

        if (array_key_exists('link', $validated)) {
            $updates['link'] = $validated['link'] !== null && $validated['link'] !== ''
                ? \App\Support\PublicUrl::rewriteLocalhost(trim((string) $validated['link']))
                : null;
        }

        if (array_key_exists('drafter_user_id', $validated)) {
            $drafter = null;
            if (! empty($validated['drafter_user_id'])) {
                $drafter = User::query()
                    ->active()
                    ->findOrFail($validated['drafter_user_id']);
            }
            $updates['drafter_user_id'] = $drafter?->id;
            $updates['drafter_initials'] = $drafter?->badgeInitials();
        }

        if (array_key_exists('checker_user_id', $validated)) {
            $checker = null;
            if (! empty($validated['checker_user_id'])) {
                $checker = User::query()
                    ->active()
                    ->findOrFail($validated['checker_user_id']);
            }
            $updates['checker_user_id'] = $checker?->id;
            $updates['checker_initials'] = $checker?->badgeInitials();
        }

        foreach (['drafting_hours', 'checking_hours', 'submitted_date'] as $field) {
            if (array_key_exists($field, $validated)) {
                $updates[$field] = $validated[$field];
            }
        }

        if (array_key_exists('area_size', $validated)) {
            $updates['area_size'] = $validated['area_size'] !== null && $validated['area_size'] !== ''
                ? trim((string) $validated['area_size'])
                : null;
        }

        $previousDrafterId = $revision->drafter_user_id;
        $previousCheckerId = $revision->checker_user_id;

        $revision->update($updates);
        $revision->refresh();

        if (
            array_key_exists('drafter_user_id', $updates)
            && (int) ($previousDrafterId ?? 0) !== (int) ($revision->drafter_user_id ?? 0)
        ) {
            DraftingRequestActivity::record(
                $draftingRequest,
                $request->user(),
                DraftingRequestActivity::ACTION_ASSIGNMENT_CHANGED,
                sprintf(
                    'Drafter on revision %s changed from %s to %s.',
                    $revision->code,
                    $this->assignmentUserLabel($previousDrafterId),
                    $this->assignmentUserLabel($revision->drafter_user_id),
                ),
            );
        }

        if (
            array_key_exists('checker_user_id', $updates)
            && (int) ($previousCheckerId ?? 0) !== (int) ($revision->checker_user_id ?? 0)
        ) {
            DraftingRequestActivity::record(
                $draftingRequest,
                $request->user(),
                DraftingRequestActivity::ACTION_ASSIGNMENT_CHANGED,
                sprintf(
                    'Checker on revision %s changed from %s to %s.',
                    $revision->code,
                    $this->assignmentUserLabel($previousCheckerId),
                    $this->assignmentUserLabel($revision->checker_user_id),
                ),
            );
        }

        $hoursLabel = $this->formatRevisionHoursLabel(
            $revision->drafting_hours,
            $revision->checking_hours,
        );

        $drafterName = $revision->drafter?->name;
        $checkerName = $revision->checker?->name;
        $people = $drafterName
            ? $drafterName.($checkerName ? ' / '.$checkerName : '')
            : ($checkerName ?? 'unassigned');

        $description = sprintf(
            'Updated revision %s (%s, %s%s).',
            $revision->code,
            $revision->category,
            $people,
            $hoursLabel ? ', '.$hoursLabel : '',
        );

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_REVISION_UPDATED,
            $description,
        );

        $this->syncJobStatusFromRevision(
            $draftingRequest,
            $request->user(),
            $validated['status'],
        );
        $this->syncJobCategoryFromSelection(
            $draftingRequest,
            $revision->category,
        );

        $this->board->syncRevisionHoursToAssignments($draftingRequest, $revision->fresh());
        $this->timesheetSync->syncRevisionToTimesheet($revision->fresh());

        return back()->with('status', 'drf-revision-updated');
    }

    public function destroyRevision(
        Request $request,
        DraftingRequest $draftingRequest,
        DraftingRequestRevision $revision,
    ): RedirectResponse {
        $this->authorizeView($request, $draftingRequest);

        if (! $request->user()?->isAdmin()) {
            abort(403);
        }

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        if ((int) $revision->drafting_request_id !== (int) $draftingRequest->id) {
            abort(404);
        }

        $code = $revision->code;
        $user = $request->user();

        $returnedToMasterlist = DB::transaction(function () use (
            $draftingRequest,
            $revision,
            $code,
            $user,
        ) {
            $revision->delete();

            DraftingRequestActivity::record(
                $draftingRequest,
                $user,
                DraftingRequestActivity::ACTION_REVISION_DELETED,
                sprintf('Deleted revision %s.', $code),
            );

            return $this->submission->returnToMasterlistIfNoRevisions(
                $draftingRequest->fresh(),
                $user,
            );
        });

        // Always return to the APM board so REVISION NO. refreshes immediately.
        return redirect()
            ->route('job.list', $this->redirectQuery($request))
            ->with(
                'status',
                $returnedToMasterlist
                    ? 'drf-revision-deleted-returned-to-masterlist'
                    : 'drf-revision-deleted',
            );
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
            'status' => DraftingRequestAccountEntry::normalizeStatus($validated['status']),
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
            ->route($this->jobShowRouteName($request), $this->jobShowRouteParams($draftingRequest, $request))
            ->with('status', $isQuote ? 'drf-quote-added' : 'drf-invoice-added');
    }

    public function updateAccountEntry(
        UpdateDraftingRequestAccountEntryRequest $request,
        DraftingRequest $draftingRequest,
        DraftingRequestAccountEntry $accountEntry,
    ): RedirectResponse {
        $validated = $request->validated();

        $accountEntry->update([
            'number' => trim($validated['number']),
            'category' => mb_strtoupper(trim($validated['category'])),
            'rate' => isset($validated['rate']) && $validated['rate'] !== ''
                ? trim($validated['rate'])
                : null,
            'status' => DraftingRequestAccountEntry::normalizeStatus($validated['status']),
        ]);

        $isQuote = $accountEntry->kind === DraftingRequestAccountEntry::KIND_QUOTE;
        $label = $isQuote ? 'quote' : 'invoice';

        $description = sprintf(
            'Updated %s %s (%s, %s%s).',
            $label,
            $accountEntry->number,
            $accountEntry->category,
            $accountEntry->status,
            $accountEntry->rate ? ', '.$accountEntry->rate : '',
        );

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            $isQuote
                ? DraftingRequestActivity::ACTION_QUOTE_UPDATED
                : DraftingRequestActivity::ACTION_INVOICE_UPDATED,
            $description,
        );

        return redirect()
            ->route($this->jobShowRouteName($request), $this->jobShowRouteParams($draftingRequest, $request))
            ->with('status', $isQuote ? 'drf-quote-updated' : 'drf-invoice-updated');
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
        $revisionId = $request->revisionId();

        DraftingRequestComment::query()->create([
            'drafting_request_id' => $draftingRequest->id,
            'drafting_request_revision_id' => $revisionId,
            'user_id' => $request->user()->id,
            'kind' => $kind,
            'body' => $body,
        ]);

        $isRun = $kind === DraftingRequestComment::KIND_RUN;
        $revisionCode = $revisionId
            ? DraftingRequestRevision::query()
                ->whereKey($revisionId)
                ->where('drafting_request_id', $draftingRequest->id)
                ->value('code')
            : null;

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            $isRun
                ? DraftingRequestActivity::ACTION_RUN_COMMENT_POSTED
                : DraftingRequestActivity::ACTION_COMMENT_POSTED,
            $this->commentActivityDescription($body, $isRun, $revisionCode),
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
                ->with([
                    'user:id,name,initials,profile_image',
                    'revision:id,drafting_request_id,code',
                ])
                ->where('kind', DraftingRequestComment::KIND_COMMENT)
                ->orderBy('created_at'),
        ]);

        return response()->json([
            'job' => [
                'id' => $draftingRequest->id,
                'reference' => $draftingRequest->jobNumber(),
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
                ->route($this->jobShowRouteName($request), $this->jobShowRouteParams($draftingRequest, $request));
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
            ->route($this->jobShowRouteName($request), $this->jobShowRouteParams($draftingRequest, $request))
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
            ->route($this->jobShowRouteName($request), $this->jobShowRouteParams($draftingRequest, $request))
            ->with('status', 'drf-files-updated');
    }

    public function viewFile(
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

        return Storage::disk($file->disk)->response(
            $file->path,
            $file->original_name,
            [
                'Content-Type' => $file->mime_type ?? 'application/octet-stream',
                'Content-Disposition' => 'inline; filename="'.str_replace('"', '\\"', $file->original_name).'"',
            ],
        );
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
        return DraftingRequest::query()
            ->with([
                'buildingType:id,name',
                'serviceEngagings:id,name',
            ])
            ->withCount('files')
            ->apm()
            ->orderByDesc('requested_at')
            ->orderByDesc('id');
    }

    /**
     * @return array<string, mixed>
     */
    private function formatListRow(DraftingRequest $row): array
    {
        return [
            'id' => $row->id,
            'reference' => $row->jobNumber(),
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

    private function assignmentUserLabel(?int $userId): string
    {
        if ($userId === null) {
            return 'Unassigned';
        }

        return User::query()->whereKey($userId)->value('name') ?? 'Unknown';
    }

    /**
     * Ensure revision codes always use lead-NN (never bare lead number alone).
     */
    private function normalizeRevisionCode(DraftingRequest $draftingRequest, string $code): string
    {
        $code = trim($code);
        $base = $draftingRequest->jobNumber();

        if ($code === $base || preg_match('/-\d{2}$/', $code) !== 1) {
            return $draftingRequest->suggestNextRevisionCode();
        }

        return $code;
    }

    /**
     * Keep the board Category column in sync with the revision category selection.
     */
    private function syncJobCategoryFromSelection(
        DraftingRequest $draftingRequest,
        ?string $categoryValue,
    ): void {
        $categoryValue = trim((string) $categoryValue);
        if ($categoryValue === '') {
            return;
        }

        $category = CrmCategory::query()
            ->active()
            ->where('status', 'active')
            ->where(function ($query) use ($categoryValue) {
                $query->where('code', $categoryValue)
                    ->orWhere('name', $categoryValue);
            })
            ->first();

        if ($category === null) {
            return;
        }

        $draftingRequest->crmCategories()->sync([$category->id]);
        $draftingRequest->forceFill([
            'crm_category_id' => $category->id,
        ])->save();
    }

    private function formatRevisionHoursLabel(
        mixed $draftingHours,
        mixed $checkingHours,
    ): ?string {
        $parts = [];

        if ($draftingHours !== null && $draftingHours !== '') {
            $parts[] = rtrim(rtrim((string) $draftingHours, '0'), '.').' drafting hrs';
        }

        if ($checkingHours !== null && $checkingHours !== '') {
            $parts[] = rtrim(rtrim((string) $checkingHours, '0'), '.').' checking hrs';
        }

        return $parts === [] ? null : implode(', ', $parts);
    }

    private function syncJobStatusFromRevision(
        DraftingRequest $draftingRequest,
        User $user,
        string $revisionStatus,
    ): void {
        if (! in_array($revisionStatus, DraftingRequest::statusValues(), true)) {
            return;
        }

        $previousStatus = $draftingRequest->status;

        if ($previousStatus === $revisionStatus) {
            return;
        }

        $draftingRequest->update(['status' => $revisionStatus]);

        $options = DraftingRequest::statusOptions();
        $fromLabel = $options[$previousStatus]
            ?? ($previousStatus ? ucfirst(str_replace('_', ' ', $previousStatus)) : 'New');
        $toLabel = $options[$revisionStatus]
            ?? ucfirst(str_replace('_', ' ', $revisionStatus));

        DraftingRequestActivity::record(
            $draftingRequest,
            $user,
            DraftingRequestActivity::ACTION_STATUS_CHANGED,
            sprintf('Status changed from %s to %s.', $fromLabel, $toLabel),
        );
    }

    private function authorizeView(Request $request, DraftingRequest $draftingRequest): void
    {
        $user = $request->user();

        if ($user === null || ! $this->userCanViewDraftingRequest($user, $draftingRequest)) {
            abort(403);
        }

        if ($draftingRequest->isArchived()) {
            if (! $user->hasPermission('job.drafting.archive')) {
                abort(403);
            }

            if (! in_array($draftingRequest->workflow_stage, [
                DraftingRequest::STAGE_MASTERLIST,
                ...DraftingRequest::projectBoardStages(),
            ], true)) {
                abort(404);
            }

            return;
        }

        if ($draftingRequest->workflow_stage === DraftingRequest::STAGE_MASTERLIST) {
            if ($draftingRequest->review_status !== DraftingRequest::REVIEW_ACCEPTED) {
                abort(404);
            }

            return;
        }

        if (! $draftingRequest->isOnProjectBoard()) {
            abort(404);
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

        $user = $request->user();
        $masterlistOk = $draftingRequest->workflow_stage === DraftingRequest::STAGE_MASTERLIST
            && $user->hasPermission('job.drafting-request.view');

        if (! $user->hasPermission('job.drafting.job-details.edit') && ! $masterlistOk) {
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
        $masterlistAccess = $draftingRequest->workflow_stage === DraftingRequest::STAGE_MASTERLIST
            && $user->hasPermission('job.drafting-request.view');

        return [
            'editJobDetails' => $canView && $active && (
                $user->hasPermission('job.drafting.job-details.edit')
                || $masterlistAccess
            ),
            'editBuildingArea' => $canView && $active && (
                $user->hasPermission('job.drafting.building-area.edit')
                || $masterlistAccess
            ),
            'editStatus' => $canView && $active && (
                $user->hasPermission('job.drafting.job-details.edit')
                || $masterlistAccess
            ),
            'archive' => $canView && $user->hasPermission('job.drafting.archive'),
            'viewRevision' => $canView && (
                $user->hasPermission('job.drafting.revision.view') || $masterlistAccess
            ),
            'addRevision' => $canView && $active && $user->hasPermission('job.drafting.revision.add'),
            'addFromMasterlist' => $canView && $active && $user->hasPermission('job.list.view'),
            'deleteRevision' => $canView && $active && $user->isAdmin(),
            'viewAccounts' => $canView && (
                $user->hasPermission('job.drafting.accounts.view') || $masterlistAccess
            ),
            'addAccount' => $canView && $active && $user->hasPermission('job.drafting.accounts.add'),
            'viewFiles' => $canView && (
                $user->hasPermission('job.drafting.files.view') || $masterlistAccess
            ),
            'editFiles' => $canView && $active && $user->hasPermission('job.drafting.files.edit'),
            'viewComments' => $canView && (
                $user->hasPermission('job.drafting.comments.view') || $masterlistAccess
            ),
            'postComments' => $canView && $active && (
                $user->hasPermission('job.drafting.comments.post') || $masterlistAccess
            ),
            'viewActivity' => $canView && (
                $user->hasPermission('job.drafting.activity.view') || $masterlistAccess
            ),
        ];
    }

    private function userCanViewDraftingRequest(
        User $user,
        DraftingRequest $draftingRequest,
    ): bool {
        if ($draftingRequest->isOnProjectBoard()
            && ($user->hasPermission('job.drafting.view')
                || $user->hasPermission('design.list.view'))) {
            return true;
        }

        if ($draftingRequest->workflow_stage === DraftingRequest::STAGE_MASTERLIST
            && $user->hasPermission('job.drafting-request.view')) {
            return true;
        }

        return false;
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
        $from = $request->query('from');

        return [
            'search' => Str::limit(trim((string) $request->query('search', '')), 255),
            'per_page' => $perPage !== null && $perPage !== ''
                ? (int) $perPage
                : null,
            'from' => in_array($from, ['archive', 'masterlist'], true) ? $from : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function jobShowRouteParams(DraftingRequest $draftingRequest, Request $request): array
    {
        return [
            'draftingRequest' => $draftingRequest->id,
            ...array_filter($this->listFiltersFromRequest($request)),
        ];
    }

    private function jobShowRouteName(Request $request): string
    {
        return $this->listFiltersFromRequest($request)['from'] === 'masterlist'
            ? 'job.masterlist.show'
            : 'job.drafting.show';
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
            'author_initials' => $comment->user?->badgeInitials(),
            'author_profile_image_url' => $comment->user?->profile_image_url,
            'created_at' => $comment->created_at?->timezone($tz)->format('d M Y, h:i A'),
            'is_mine' => $comment->user_id === auth()->id(),
            'revision_id' => $comment->drafting_request_revision_id,
            'revision_code' => $comment->revision?->code,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function formatActivities(DraftingRequest $draftingRequest, string $tz): array
    {
        return DraftingRequestActivity::query()
            ->where('drafting_request_id', $draftingRequest->id)
            ->with('user:id,name,initials,profile_image')
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
                DraftingRequestActivity::ACTION_REQUEST_ACCEPTED => 'Accepted drafting request',
                DraftingRequestActivity::ACTION_FORWARDED_TO_APM => 'Forwarded to APM',
                DraftingRequestActivity::ACTION_RETURNED_TO_MASTERLIST => 'Returned to masterlist',
                DraftingRequestActivity::ACTION_COMMENT_POSTED => 'Posted a comment',
                DraftingRequestActivity::ACTION_RUN_COMMENT_POSTED => 'Posted a run comment',
                DraftingRequestActivity::ACTION_ARCHIVED => 'Archived drafting request',
                DraftingRequestActivity::ACTION_RESTORED => 'Restored drafting request',
                DraftingRequestActivity::ACTION_STATUS_CHANGED => 'Changed status',
                DraftingRequestActivity::ACTION_DETAILS_UPDATED => 'Updated details',
                DraftingRequestActivity::ACTION_FILES_UPDATED => 'Updated files',
                DraftingRequestActivity::ACTION_REVISION_ADDED => 'Added revision',
                DraftingRequestActivity::ACTION_REVISION_UPDATED => 'Updated revision',
                DraftingRequestActivity::ACTION_REVISION_DELETED => 'Deleted revision',
                DraftingRequestActivity::ACTION_QUOTE_ADDED => 'Added quote',
                DraftingRequestActivity::ACTION_QUOTE_UPDATED => 'Updated quote',
                DraftingRequestActivity::ACTION_INVOICE_ADDED => 'Added invoice',
                DraftingRequestActivity::ACTION_INVOICE_UPDATED => 'Updated invoice',
                DraftingRequestActivity::ACTION_DRAWING_CHECKLIST_UPDATED => 'Updated drawing status',
                DraftingRequestActivity::ACTION_DRAWING_CHECKLIST_RESET => 'Reset drawing status',
                DraftingRequestActivity::ACTION_ASSIGNMENT_CHANGED => 'Changed assignment',
                default => 'Activity',
            },
            'description' => $activity->description,
            'user_name' => $activity->user?->name ?? 'Unknown',
            'user_initials' => $activity->user?->badgeInitials(),
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

    private function commentActivityDescription(
        string $body,
        bool $isRun = false,
        ?string $revisionCode = null,
    ): string {
        $text = trim(strip_tags($body));
        $revisionPrefix = $revisionCode
            ? '['.$revisionCode.'] '
            : '';

        if ($text === '') {
            return $revisionPrefix.($isRun
                ? 'Added a run comment with rich text only.'
                : 'Added a comment with rich text only.');
        }

        $prefix = ($isRun ? 'Run comment: ' : '').$revisionPrefix;

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
            'job' => 'project info',
            'building' => 'building specifications',
            'notes' => 'notes',
            'building_area' => 'building area',
            'drawing_checklist' => 'drawing status',
            'drawing_checklist_reset' => 'drawing status',
            default => 'details',
        };
    }

    /**
     * @param  list<array{unit_number?: int, house_type?: string|null, area_sqm?: mixed}>  $units
     */
    private function syncUnits(
        DraftingRequest $draftingRequest,
        int $count,
        array $units,
    ): void {
        $count = max(0, min(50, $count));
        $byNumber = collect($units)
            ->filter(fn ($unit) => isset($unit['unit_number']))
            ->keyBy(fn ($unit) => (int) $unit['unit_number']);

        DB::transaction(function () use ($draftingRequest, $count, $byNumber) {
            $draftingRequest->units()
                ->where('unit_number', '>', $count)
                ->delete();

            for ($n = 1; $n <= $count; $n++) {
                $row = $byNumber->get($n, []);
                $area = $row['area_sqm'] ?? null;

                $draftingRequest->units()->updateOrCreate(
                    ['unit_number' => $n],
                    [
                        'house_type' => isset($row['house_type']) && $row['house_type'] !== ''
                            ? trim((string) $row['house_type'])
                            : null,
                        'area_sqm' => $area === '' || $area === null ? null : $area,
                    ],
                );
            }
        });
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
