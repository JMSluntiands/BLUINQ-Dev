<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = Role::query()
            ->withCount('users')
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('slug', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Roles/Index', [
            'roles' => $query
                ->paginate($perPage)
                ->through(fn (Role $r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                    'slug' => $r->slug,
                    'is_system' => $r->is_system,
                    'users_count' => $r->users_count,
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Settings/Roles/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:32',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique(Role::class, 'slug'),
            ],
        ]);

        $maxSort = (int) Role::query()->max('sort_order');

        Role::query()->create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'is_system' => false,
            'sort_order' => $maxSort + 1,
        ]);

        return redirect()
            ->route('settings.roles.index', $this->redirectQuery($request))
            ->with('status', 'role-created');
    }

    public function edit(Request $request, Role $role): Response
    {
        return Inertia::render('Settings/Roles/Edit', [
            'role' => $role->only(['id', 'name', 'slug', 'is_system']),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $role->name = $validated['name'];
        $role->save();

        return redirect()
            ->route('settings.roles.index', $this->redirectQuery($request))
            ->with('status', 'role-updated');
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        if ($role->is_system) {
            return redirect()
                ->route('settings.roles.index', $this->redirectQuery($request))
                ->with('status', 'role-system-protected');
        }

        if ($role->users()->exists()) {
            return redirect()
                ->route('settings.roles.index', $this->redirectQuery($request))
                ->with('status', 'role-has-users');
        }

        $role->delete();

        return redirect()
            ->route('settings.roles.index', $this->redirectQuery($request))
            ->with('status', 'role-deleted');
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
