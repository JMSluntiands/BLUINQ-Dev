<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Models\DraftingRequest;
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
                ->through(fn (DraftingRequest $row) => $this->board->formatBoardRow($row))
                ->withQueryString(),
            'filters' => $filters,
            'canViewAllRequests' => $request->user()?->isAdmin() ?? false,
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
}
