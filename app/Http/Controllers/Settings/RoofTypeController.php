<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\RoofType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RoofTypeController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = RoofType::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/RoofType/Index', [
            'roofTypes' => $query
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
        return Inertia::render('Settings/RoofType/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        RoofType::query()->create([
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('settings.roof-type.index', $this->redirectQuery($request))
            ->with('status', 'roof-type-created');
    }

    public function edit(Request $request, RoofType $roofType): Response
    {
        if ($roofType->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/RoofType/Edit', [
            'roofType' => $roofType->only(['id', 'name', 'status']),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, RoofType $roofType): RedirectResponse
    {
        if ($roofType->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $roofType->update($validated);

        return redirect()
            ->route('settings.roof-type.index', $this->redirectQuery($request))
            ->with('status', 'roof-type-updated');
    }

    public function destroy(Request $request, RoofType $roofType): RedirectResponse
    {
        if ($roofType->archived_at !== null) {
            return redirect()
                ->route('settings.roof-type.archive', $this->redirectQuery($request))
                ->with('status', 'roof-type-already-archived');
        }

        $roofType->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.roof-type.index', $this->redirectQuery($request))
            ->with('status', 'roof-type-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = RoofType::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/RoofType/Archive', [
            'roofTypes' => $query
                ->paginate($perPage)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, RoofType $roofType): RedirectResponse
    {
        if ($roofType->archived_at === null) {
            return redirect()
                ->route('settings.roof-type.index', $this->redirectQuery($request))
                ->with('status', 'roof-type-not-archived');
        }

        $roofType->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.roof-type.archive', $this->redirectQuery($request))
            ->with('status', 'roof-type-restored');
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
