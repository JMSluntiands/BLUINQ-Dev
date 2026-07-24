<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = Client::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('contact_name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Client/Index', [
            'clients' => $query
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
        return Inertia::render('Settings/Client/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        Client::query()->create($validated);

        return redirect()
            ->route('settings.client.index', $this->redirectQuery($request))
            ->with('status', 'client-created');
    }

    public function edit(Request $request, Client $client): Response
    {
        if ($client->archived_at !== null) {
            abort(404);
        }

        return Inertia::render('Settings/Client/Edit', [
            'client' => $client->only([
                'id',
                'name',
                'contact_name',
                'email',
                'phone',
                'status',
            ]),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, Client $client): RedirectResponse
    {
        if ($client->archived_at !== null) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $client->update($validated);

        return redirect()
            ->route('settings.client.index', $this->redirectQuery($request))
            ->with('status', 'client-updated');
    }

    public function destroy(Request $request, Client $client): RedirectResponse
    {
        if ($client->archived_at !== null) {
            return redirect()
                ->route('settings.client.archive', $this->redirectQuery($request))
                ->with('status', 'client-already-archived');
        }

        $client->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.client.index', $this->redirectQuery($request))
            ->with('status', 'client-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = Client::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('contact_name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%')
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Client/Archive', [
            'clients' => $query
                ->paginate($perPage)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, Client $client): RedirectResponse
    {
        if ($client->archived_at === null) {
            return redirect()
                ->route('settings.client.index', $this->redirectQuery($request))
                ->with('status', 'client-not-archived');
        }

        $client->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.client.archive', $this->redirectQuery($request))
            ->with('status', 'client-restored');
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
