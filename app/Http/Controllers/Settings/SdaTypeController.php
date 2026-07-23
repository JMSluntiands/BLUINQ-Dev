<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SdaType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SdaTypeController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = SdaType::query()->active()->orderBy('code')->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', '%'.$search.'%')
                    ->orWhere('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/SdaType/Index', [
            'sdaTypes' => $query
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
        return Inertia::render('Settings/SdaType/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:64', Rule::unique('sda_types', 'code')],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        SdaType::query()->create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('settings.sda-type.index', $this->redirectQuery($request))
            ->with('status', 'sda-type-created');
    }

    public function edit(Request $request, SdaType $sdaType): Response
    {
        if ($sdaType->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/SdaType/Edit', [
            'sdaType' => $sdaType->only(['id', 'code', 'name', 'status']),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, SdaType $sdaType): RedirectResponse
    {
        if ($sdaType->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('sda_types', 'code')->ignore($sdaType->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $sdaType->update($validated);

        return redirect()
            ->route('settings.sda-type.index', $this->redirectQuery($request))
            ->with('status', 'sda-type-updated');
    }

    public function destroy(Request $request, SdaType $sdaType): RedirectResponse
    {
        if ($sdaType->archived_at !== null) {
            return redirect()
                ->route('settings.sda-type.archive', $this->redirectQuery($request))
                ->with('status', 'sda-type-already-archived');
        }

        $sdaType->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.sda-type.index', $this->redirectQuery($request))
            ->with('status', 'sda-type-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = SdaType::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', '%'.$search.'%')
                    ->orWhere('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/SdaType/Archive', [
            'sdaTypes' => $query
                ->paginate($perPage)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, SdaType $sdaType): RedirectResponse
    {
        if ($sdaType->archived_at === null) {
            return redirect()
                ->route('settings.sda-type.index', $this->redirectQuery($request))
                ->with('status', 'sda-type-not-archived');
        }

        $sdaType->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.sda-type.archive', $this->redirectQuery($request))
            ->with('status', 'sda-type-restored');
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
