<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ScopeOfWork;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ScopeOfWorkController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = ScopeOfWork::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/ScopeOfWork/Index', [
            'scopeOfWorks' => $query
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
        return Inertia::render('Settings/ScopeOfWork/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        ScopeOfWork::query()->create([
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('settings.scope-of-work.index', $this->redirectQuery($request))
            ->with('status', 'scope-of-work-created');
    }

    public function edit(Request $request, ScopeOfWork $scopeOfWork): Response
    {
        if ($scopeOfWork->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/ScopeOfWork/Edit', [
            'scopeOfWork' => $scopeOfWork->only(['id', 'name', 'status']),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, ScopeOfWork $scopeOfWork): RedirectResponse
    {
        if ($scopeOfWork->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $scopeOfWork->update($validated);

        return redirect()
            ->route('settings.scope-of-work.index', $this->redirectQuery($request))
            ->with('status', 'scope-of-work-updated');
    }

    public function destroy(Request $request, ScopeOfWork $scopeOfWork): RedirectResponse
    {
        if ($scopeOfWork->archived_at !== null) {
            return redirect()
                ->route('settings.scope-of-work.archive', $this->redirectQuery($request))
                ->with('status', 'scope-of-work-already-archived');
        }

        $scopeOfWork->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.scope-of-work.index', $this->redirectQuery($request))
            ->with('status', 'scope-of-work-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = ScopeOfWork::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/ScopeOfWork/Archive', [
            'scopeOfWorks' => $query
                ->paginate($perPage)
                ->through(fn (ScopeOfWork $row) => [
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

    public function restore(Request $request, ScopeOfWork $scopeOfWork): RedirectResponse
    {
        if ($scopeOfWork->archived_at === null) {
            return redirect()
                ->route('settings.scope-of-work.index', $this->redirectQuery($request))
                ->with('status', 'scope-of-work-not-archived');
        }

        $scopeOfWork->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.scope-of-work.archive', $this->redirectQuery($request))
            ->with('status', 'scope-of-work-restored');
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
