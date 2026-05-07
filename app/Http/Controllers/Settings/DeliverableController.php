<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Deliverable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DeliverableController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = Deliverable::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Deliverables/Index', [
            'deliverables' => $query
                ->paginate($perPage)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Settings/Deliverables/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        Deliverable::query()->create([
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('settings.deliverables.index', $this->redirectQuery($request))
            ->with('status', 'deliverables-created');
    }

    public function edit(Request $request, Deliverable $deliverable): Response
    {
        if ($deliverable->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/Deliverables/Edit', [
            'deliverable' => $deliverable->only(['id', 'name', 'status']),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, Deliverable $deliverable): RedirectResponse
    {
        if ($deliverable->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $deliverable->update($validated);

        return redirect()
            ->route('settings.deliverables.index', $this->redirectQuery($request))
            ->with('status', 'deliverables-updated');
    }

    public function destroy(Request $request, Deliverable $deliverable): RedirectResponse
    {
        if ($deliverable->archived_at !== null) {
            return redirect()
                ->route('settings.deliverables.archive', $this->redirectQuery($request))
                ->with('status', 'deliverables-already-archived');
        }

        $deliverable->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.deliverables.index', $this->redirectQuery($request))
            ->with('status', 'deliverables-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = Deliverable::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Deliverables/Archive', [
            'deliverables' => $query
                ->paginate($perPage)
                ->through(fn (Deliverable $row) => [
                    'id' => $row->id,
                    'name' => $row->name,
                    'status' => $row->status,
                    'archived_at' => $row->archived_at?->toIso8601String(),
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, Deliverable $deliverable): RedirectResponse
    {
        if ($deliverable->archived_at === null) {
            return redirect()
                ->route('settings.deliverables.index', $this->redirectQuery($request))
                ->with('status', 'deliverables-not-archived');
        }

        $deliverable->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.deliverables.archive', $this->redirectQuery($request))
            ->with('status', 'deliverables-restored');
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
