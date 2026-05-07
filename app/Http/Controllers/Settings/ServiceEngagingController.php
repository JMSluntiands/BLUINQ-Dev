<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ServiceEngaging;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ServiceEngagingController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = ServiceEngaging::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/ServiceEngaging/Index', [
            'serviceEngagings' => $query
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
        return Inertia::render('Settings/ServiceEngaging/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        ServiceEngaging::query()->create([
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('settings.service-engaging.index', $this->redirectQuery($request))
            ->with('status', 'service-engaging-created');
    }

    public function edit(Request $request, ServiceEngaging $serviceEngaging): Response
    {
        if ($serviceEngaging->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/ServiceEngaging/Edit', [
            'serviceEngaging' => $serviceEngaging->only(['id', 'name', 'status']),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, ServiceEngaging $serviceEngaging): RedirectResponse
    {
        if ($serviceEngaging->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $serviceEngaging->update($validated);

        return redirect()
            ->route('settings.service-engaging.index', $this->redirectQuery($request))
            ->with('status', 'service-engaging-updated');
    }

    public function destroy(Request $request, ServiceEngaging $serviceEngaging): RedirectResponse
    {
        if ($serviceEngaging->archived_at !== null) {
            return redirect()
                ->route('settings.service-engaging.archive', $this->redirectQuery($request))
                ->with('status', 'service-engaging-already-archived');
        }

        $serviceEngaging->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.service-engaging.index', $this->redirectQuery($request))
            ->with('status', 'service-engaging-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = ServiceEngaging::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/ServiceEngaging/Archive', [
            'serviceEngagings' => $query
                ->paginate($perPage)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, ServiceEngaging $serviceEngaging): RedirectResponse
    {
        if ($serviceEngaging->archived_at === null) {
            return redirect()
                ->route('settings.service-engaging.index', $this->redirectQuery($request))
                ->with('status', 'service-engaging-not-archived');
        }

        $serviceEngaging->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.service-engaging.archive', $this->redirectQuery($request))
            ->with('status', 'service-engaging-restored');
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
