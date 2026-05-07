<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\BuildingType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BuildingTypeController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = BuildingType::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/BuildingType/Index', [
            'buildingTypes' => $query
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
        return Inertia::render('Settings/BuildingType/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        BuildingType::query()->create([
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('settings.building-type.index', $this->redirectQuery($request))
            ->with('status', 'building-type-created');
    }

    public function edit(Request $request, BuildingType $buildingType): Response
    {
        if ($buildingType->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/BuildingType/Edit', [
            'buildingType' => $buildingType->only(['id', 'name', 'status']),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, BuildingType $buildingType): RedirectResponse
    {
        if ($buildingType->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $buildingType->update($validated);

        return redirect()
            ->route('settings.building-type.index', $this->redirectQuery($request))
            ->with('status', 'building-type-updated');
    }

    public function destroy(Request $request, BuildingType $buildingType): RedirectResponse
    {
        if ($buildingType->archived_at !== null) {
            return redirect()
                ->route('settings.building-type.archive', $this->redirectQuery($request))
                ->with('status', 'building-type-already-archived');
        }

        $buildingType->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.building-type.index', $this->redirectQuery($request))
            ->with('status', 'building-type-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = BuildingType::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/BuildingType/Archive', [
            'buildingTypes' => $query
                ->paginate($perPage)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, BuildingType $buildingType): RedirectResponse
    {
        if ($buildingType->archived_at === null) {
            return redirect()
                ->route('settings.building-type.index', $this->redirectQuery($request))
                ->with('status', 'building-type-not-archived');
        }

        $buildingType->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.building-type.archive', $this->redirectQuery($request))
            ->with('status', 'building-type-restored');
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
