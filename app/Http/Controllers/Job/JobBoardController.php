<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDraftingRequestAssignmentRequest;
use App\Http\Requests\UpdateDraftingRequestBoardFieldsRequest;
use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestAssignment;
use App\Models\User;
use App\Services\DraftingRequestBoardService;
use App\Services\DraftingRequestReviewService;
use App\Services\DraftingRequestSubmissionService;
use Carbon\Carbon;
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
        return $this->renderBoard($request, groupByStatus: true);
    }

    private function renderBoard(Request $request, bool $groupByStatus): Response
    {
        $filters = $this->board->resolveListFilters($request);

        $query = $this->board->baseQuery($request);
        $this->board->applySearch($query, $filters['search']);

        $user = $request->user();
        $canReviewPublicRequests = $user?->hasPermission('job.drafting-request.review') ?? false;
        $canForwardFromMasterlist = $user?->hasPermission('job.list.view') ?? false;
        $canAddRevision = $user?->hasPermission('job.drafting.revision.add') ?? false;

        return Inertia::render('Job/Board', [
            'jobs' => $query
                ->paginate($filters['per_page'])
                ->through(function (DraftingRequest $row) use ($request, $canAddRevision) {
                    $formatted = $this->board->formatBoardRow($row);
                    $formatted['can_assign'] = $this->board->canAssignStaff($request, $row);
                    $formatted['can_add_revision'] = $canAddRevision
                        && $this->board->canAssignStaff($request, $row);

                    return $formatted;
                })
                ->withQueryString(),
            'filters' => $filters,
            'canViewAllRequests' => $user?->isAdmin() ?? false,
            'canReviewPublicRequests' => $canReviewPublicRequests,
            'canForwardFromMasterlist' => $canForwardFromMasterlist,
            'masterlistCandidates' => $canForwardFromMasterlist
                ? $this->masterlistCandidatesForBoard($request)
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
            'statusOptions' => collect(DraftingRequest::statusOptions())
                ->map(fn (string $label, string $value) => [
                    'value' => $value,
                    'label' => $label,
                ])
                ->values()
                ->all(),
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
     * Masterlist entries and reopenable APM jobs for the board Add control.
     *
     * @return list<array{id: int, value: string, label: string, lead_no: string, source: string}>
     */
    private function masterlistCandidatesForBoard(Request $request): array
    {
        $user = $request->user();
        $search = trim((string) ($request->input('q') ?? $request->input('search') ?? ''));
        $byId = [];

        foreach ($this->formatAddCandidates(
            $this->masterlistCandidateQuery($user)->limit(200)->get(),
            'masterlist',
        ) as $row) {
            $byId[$row['id']] = $row;
        }

        foreach ($this->formatAddCandidates(
            $this->reopenableApmCandidateQuery($user)->limit(200)->get(),
            'apm',
        ) as $row) {
            $byId[$row['id']] = $row;
        }

        if ($search !== '') {
            foreach ($this->formatAddCandidates(
                $this->searchApmCandidateQuery($user, $search)->limit(50)->get(),
                'apm',
            ) as $row) {
                $byId[$row['id']] = $row;
            }
        }

        return array_values($byId);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, DraftingRequest>  $rows
     * @return list<array{id: int, value: string, label: string, lead_no: string, source: string}>
     */
    private function formatAddCandidates($rows, string $source): array
    {
        $statusLabels = DraftingRequest::statusLabels();

        return $rows
            ->map(function (DraftingRequest $row) use ($source, $statusLabels) {
                $leadNo = $row->jobNumber();
                $client = $row->company_name ?: ($row->your_name ?: '—');
                $job = $row->site_address ?: '—';
                $label = "{$leadNo} — {$client} — {$job}";

                if ($source === 'apm') {
                    $status = $row->status ?? DraftingRequest::STATUS_NEW;
                    $statusLabel = $statusLabels[$status]
                        ?? ucfirst(str_replace('_', ' ', $status));
                    $label .= " ({$statusLabel})";
                }

                return [
                    'id' => $row->id,
                    'value' => (string) $row->id,
                    'lead_no' => $leadNo,
                    'label' => $label,
                    'source' => $source,
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
        $query = DraftingRequest::query()
            ->masterlist()
            ->reviewAccepted()
            ->active()
            ->orderByDesc('requested_at')
            ->orderByDesc('id');

        if ($user !== null && ! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query;
    }

    /**
     * Completed-bucket APM jobs that are useful to reopen by default.
     *
     * @return \Illuminate\Database\Eloquent\Builder<DraftingRequest>
     */
    private function reopenableApmCandidateQuery(?User $user)
    {
        $query = DraftingRequest::query()
            ->apm()
            ->reviewAccepted()
            ->active()
            ->whereIn('status', [
                DraftingRequest::STATUS_SUBMITTED,
                DraftingRequest::STATUS_PAID,
                DraftingRequest::STATUS_INVOICED,
            ])
            ->orderByDesc('updated_at')
            ->orderByDesc('requested_at')
            ->orderByDesc('id');

        if ($user !== null && ! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query;
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<DraftingRequest>
     */
    private function searchApmCandidateQuery(?User $user, string $search)
    {
        $query = DraftingRequest::query()
            ->apm()
            ->reviewAccepted()
            ->active()
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        if ($user !== null && ! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        $digits = preg_replace('/\D+/', '', $search) ?? '';

        $query->where(function ($q) use ($search, $digits) {
            $q->where('company_name', 'like', '%'.$search.'%')
                ->orWhere('your_name', 'like', '%'.$search.'%')
                ->orWhere('site_address', 'like', '%'.$search.'%')
                ->orWhere('site_owner_name', 'like', '%'.$search.'%');

            if ($digits !== '') {
                $q->orWhere('id', (int) $digits);

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
        abort_unless(
            $request->user()?->hasPermission('job.list.view'),
            403,
        );

        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        if (! $user->isAdmin() && $draftingRequest->user_id !== $user->id) {
            abort(403);
        }

        $result = $this->submission->addOrReopenOnBoard($draftingRequest, $user);

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
        $user = $request->user();

        if ($user !== null && ! $user->isAdmin() && $draftingRequest->user_id !== $user->id) {
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

        return back();
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

        return back();
    }
}
