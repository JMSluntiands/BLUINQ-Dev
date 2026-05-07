<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ExternalWallConstruction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ExternalWallConstructionController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = ExternalWallConstruction::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/ExternalWallConstruction/Index', [
            'externalWallConstructions' => $query
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
        return Inertia::render('Settings/ExternalWallConstruction/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        ExternalWallConstruction::query()->create([
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('settings.external-wall-construction.index', $this->redirectQuery($request))
            ->with('status', 'external-wall-construction-created');
    }

    public function edit(Request $request, ExternalWallConstruction $externalWallConstruction): Response
    {
        if ($externalWallConstruction->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/ExternalWallConstruction/Edit', [
            'externalWallConstruction' => $externalWallConstruction->only(['id', 'name', 'status']),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, ExternalWallConstruction $externalWallConstruction): RedirectResponse
    {
        if ($externalWallConstruction->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $externalWallConstruction->update($validated);

        return redirect()
            ->route('settings.external-wall-construction.index', $this->redirectQuery($request))
            ->with('status', 'external-wall-construction-updated');
    }

    public function destroy(Request $request, ExternalWallConstruction $externalWallConstruction): RedirectResponse
    {
        if ($externalWallConstruction->archived_at !== null) {
            return redirect()
                ->route('settings.external-wall-construction.archive', $this->redirectQuery($request))
                ->with('status', 'external-wall-construction-already-archived');
        }

        $externalWallConstruction->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.external-wall-construction.index', $this->redirectQuery($request))
            ->with('status', 'external-wall-construction-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = ExternalWallConstruction::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/ExternalWallConstruction/Archive', [
            'externalWallConstructions' => $query
                ->paginate($perPage)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, ExternalWallConstruction $externalWallConstruction): RedirectResponse
    {
        if ($externalWallConstruction->archived_at === null) {
            return redirect()
                ->route('settings.external-wall-construction.index', $this->redirectQuery($request))
                ->with('status', 'external-wall-construction-not-archived');
        }

        $externalWallConstruction->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.external-wall-construction.archive', $this->redirectQuery($request))
            ->with('status', 'external-wall-construction-restored');
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
