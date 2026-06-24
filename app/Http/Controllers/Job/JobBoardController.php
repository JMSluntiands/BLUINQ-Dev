<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDraftingRequestAssignmentRequest;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestAssignment;
use App\Services\DraftingRequestBoardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobBoardController extends Controller
{
    public function __construct(
        private DraftingRequestBoardService $board,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->board->resolveListFilters($request);

        $query = $this->board->baseQuery($request);
        $this->board->applySearch($query, $filters['search']);

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
            'canViewAllRequests' => $request->user()?->isAdmin() ?? false,
            'assignableUsers' => $this->board->assignableUsers(),
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
        }

        return back();
    }
}
