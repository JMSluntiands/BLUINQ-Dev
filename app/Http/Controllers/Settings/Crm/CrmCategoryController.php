<?php

namespace App\Http\Controllers\Settings\Crm;

use App\Http\Controllers\Controller;
use App\Models\CrmCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CrmCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = CrmCategory::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Crm/Categories/Index', [
            'crmCategories' => $query
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
        return Inertia::render('Settings/Crm/Categories/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        CrmCategory::query()->create([
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('settings.crm.categories.index', $this->redirectQuery($request))
            ->with('status', 'crm-category-created');
    }

    public function edit(Request $request, CrmCategory $crmCategory): Response
    {
        if ($crmCategory->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/Crm/Categories/Edit', [
            'crmCategory' => $crmCategory->only(['id', 'name', 'status']),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, CrmCategory $crmCategory): RedirectResponse
    {
        if ($crmCategory->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $crmCategory->update($validated);

        return redirect()
            ->route('settings.crm.categories.index', $this->redirectQuery($request))
            ->with('status', 'crm-category-updated');
    }

    public function destroy(Request $request, CrmCategory $crmCategory): RedirectResponse
    {
        if ($crmCategory->archived_at !== null) {
            return redirect()
                ->route('settings.crm.categories.archive', $this->redirectQuery($request))
                ->with('status', 'crm-category-already-archived');
        }

        $crmCategory->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.crm.categories.index', $this->redirectQuery($request))
            ->with('status', 'crm-category-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = CrmCategory::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Crm/Categories/Archive', [
            'crmCategories' => $query
                ->paginate($perPage)
                ->through(fn (CrmCategory $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'status' => $c->status,
                    'archived_at' => $c->archived_at?->toIso8601String(),
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, CrmCategory $crmCategory): RedirectResponse
    {
        if ($crmCategory->archived_at === null) {
            return redirect()
                ->route('settings.crm.categories.index', $this->redirectQuery($request))
                ->with('status', 'crm-category-not-archived');
        }

        $crmCategory->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.crm.categories.archive', $this->redirectQuery($request))
            ->with('status', 'crm-category-restored');
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
