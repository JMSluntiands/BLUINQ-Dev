<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\WorkflowStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowStatusController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = WorkflowStatus::query()
            ->active()
            ->orderBy('kind')
            ->orderBy('code')
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('kind', 'like', '%'.$search.'%')
                    ->orWhere('code', 'like', '%'.$search.'%')
                    ->orWhere('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/WorkflowStatus/Index', [
            'workflowStatuses' => $query
                ->paginate($perPage)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'kindOptions' => WorkflowStatus::kindOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Settings/WorkflowStatus/Create', [
            'kindOptions' => WorkflowStatus::kindOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'kind' => ['required', 'string', 'in:archi,accounts'],
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('workflow_statuses', 'code')
                    ->where(fn ($q) => $q->where('kind', $request->input('kind'))),
            ],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        WorkflowStatus::query()->create([
            'kind' => $validated['kind'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('settings.workflow-status.index', $this->redirectQuery($request))
            ->with('status', 'workflow-status-created');
    }

    public function edit(Request $request, WorkflowStatus $workflowStatus): Response
    {
        if ($workflowStatus->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/WorkflowStatus/Edit', [
            'workflowStatus' => $workflowStatus->only(['id', 'kind', 'code', 'name', 'status']),
            'kindOptions' => WorkflowStatus::kindOptions(),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, WorkflowStatus $workflowStatus): RedirectResponse
    {
        if ($workflowStatus->archived_at !== null) {
            abort(404);
        }

        $kind = $request->input('kind', $workflowStatus->kind);

        $validated = $request->validate([
            'kind' => ['required', 'string', 'in:archi,accounts'],
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('workflow_statuses', 'code')
                    ->where(fn ($q) => $q->where('kind', $kind))
                    ->ignore($workflowStatus->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $workflowStatus->update($validated);

        return redirect()
            ->route('settings.workflow-status.index', $this->redirectQuery($request))
            ->with('status', 'workflow-status-updated');
    }

    public function destroy(Request $request, WorkflowStatus $workflowStatus): RedirectResponse
    {
        if ($workflowStatus->archived_at !== null) {
            return redirect()
                ->route('settings.workflow-status.archive', $this->redirectQuery($request))
                ->with('status', 'workflow-status-already-archived');
        }

        $workflowStatus->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.workflow-status.index', $this->redirectQuery($request))
            ->with('status', 'workflow-status-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = WorkflowStatus::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('kind', 'like', '%'.$search.'%')
                    ->orWhere('code', 'like', '%'.$search.'%')
                    ->orWhere('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/WorkflowStatus/Archive', [
            'workflowStatuses' => $query
                ->paginate($perPage)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'kindOptions' => WorkflowStatus::kindOptions(),
        ]);
    }

    public function restore(Request $request, WorkflowStatus $workflowStatus): RedirectResponse
    {
        if ($workflowStatus->archived_at === null) {
            return redirect()
                ->route('settings.workflow-status.index', $this->redirectQuery($request))
                ->with('status', 'workflow-status-not-archived');
        }

        $workflowStatus->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.workflow-status.archive', $this->redirectQuery($request))
            ->with('status', 'workflow-status-restored');
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
     * @return array<string, int|string>
     */
    private function redirectQuery(Request $request): array
    {
        $out = [];
        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $out['search'] = Str::limit($search, 255);
        }
        if ($request->filled('per_page')) {
            $p = (int) $request->input('per_page');
            if ($p >= 5 && $p <= 50) {
                $out['per_page'] = $p;
            }
        }

        return $out;
    }
}
