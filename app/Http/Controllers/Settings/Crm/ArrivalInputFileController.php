<?php

namespace App\Http\Controllers\Settings\Crm;

use App\Http\Controllers\Controller;
use App\Models\ArrivalInputFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ArrivalInputFileController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = ArrivalInputFile::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Crm/ArrivalInputFiles/Index', [
            'arrivalInputFiles' => $query
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
        return Inertia::render('Settings/Crm/ArrivalInputFiles/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        ArrivalInputFile::query()->create([
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('settings.crm.arrival-input-files.index', $this->redirectQuery($request))
            ->with('status', 'arrival-input-file-created');
    }

    public function edit(Request $request, ArrivalInputFile $arrivalInputFile): Response
    {
        if ($arrivalInputFile->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/Crm/ArrivalInputFiles/Edit', [
            'arrivalInputFile' => $arrivalInputFile->only(['id', 'name', 'status']),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, ArrivalInputFile $arrivalInputFile): RedirectResponse
    {
        if ($arrivalInputFile->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $arrivalInputFile->update($validated);

        return redirect()
            ->route('settings.crm.arrival-input-files.index', $this->redirectQuery($request))
            ->with('status', 'arrival-input-file-updated');
    }

    public function destroy(Request $request, ArrivalInputFile $arrivalInputFile): RedirectResponse
    {
        if ($arrivalInputFile->archived_at !== null) {
            return redirect()
                ->route('settings.crm.arrival-input-files.archive', $this->redirectQuery($request))
                ->with('status', 'arrival-input-file-already-archived');
        }

        $arrivalInputFile->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.crm.arrival-input-files.index', $this->redirectQuery($request))
            ->with('status', 'arrival-input-file-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = ArrivalInputFile::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Crm/ArrivalInputFiles/Archive', [
            'arrivalInputFiles' => $query
                ->paginate($perPage)
                ->through(fn (ArrivalInputFile $f) => [
                    'id' => $f->id,
                    'name' => $f->name,
                    'status' => $f->status,
                    'archived_at' => $f->archived_at?->toIso8601String(),
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, ArrivalInputFile $arrivalInputFile): RedirectResponse
    {
        if ($arrivalInputFile->archived_at === null) {
            return redirect()
                ->route('settings.crm.arrival-input-files.index', $this->redirectQuery($request))
                ->with('status', 'arrival-input-file-not-archived');
        }

        $arrivalInputFile->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.crm.arrival-input-files.archive', $this->redirectQuery($request))
            ->with('status', 'arrival-input-file-restored');
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
