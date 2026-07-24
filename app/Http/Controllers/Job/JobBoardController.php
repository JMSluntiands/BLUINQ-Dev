<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDraftingRequestAssignmentRequest;
use App\Http\Requests\UpdateDraftingRequestBoardFieldsRequest;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestAssignment;
use App\Services\DraftingRequestBoardService;
use App\Services\DraftingRequestReviewService;
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
    ) {}

    public function index(Request $request): Response
    {
        return $this->renderBoard($request, groupByStatus: false);
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

        return Inertia::render('Job/Board', [
            'jobs' => $query
                ->paginate($filters['per_page'])
                ->through(function (DraftingRequest $row) use ($request) {
                    $formatted = $this->board->formatBoardRow($row);
                    $formatted['can_assign'] = $this->board->canAssignStaff($request, $row);

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
            'groupByStatus' => $groupByStatus,
            'jobListSections' => [],
        ]);
    }

    /**
     * Masterlist entries not yet on the APM board.
     *
     * @return list<array{id: int, value: string, label: string, lead_no: string}>
     */
    private function masterlistCandidatesForBoard(Request $request): array
    {
        $user = $request->user();

        $query = DraftingRequest::query()
            ->masterlist()
            ->reviewAccepted()
            ->active()
            ->orderByDesc('requested_at')
            ->orderByDesc('id');

        if ($user !== null && ! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query
            ->limit(200)
            ->get(['id', 'requested_at', 'created_at', 'company_name', 'your_name', 'site_address'])
            ->map(function (DraftingRequest $row) {
                $leadNo = $row->jobNumber();
                $client = $row->company_name ?: ($row->your_name ?: '—');
                $job = $row->site_address ?: '—';

                return [
                    'id' => $row->id,
                    'value' => (string) $row->id,
                    'lead_no' => $leadNo,
                    'label' => "{$leadNo} — {$client} — {$job}",
                ];
            })
            ->values()
            ->all();
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
        return redirect()->route('job.board', $request->query());
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

            $this->board->syncAssignmentHoursToRevision(
                $draftingRequest,
                $role,
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
