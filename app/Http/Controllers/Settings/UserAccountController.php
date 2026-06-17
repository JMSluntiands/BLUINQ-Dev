<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserAccountController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = User::query()
            ->with('role')
            ->active()
            ->whereHas('role', fn ($q) => $q->where('slug', '!=', 'admin'))
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Users/Index', [
            'users' => $query
                ->paginate($perPage)
                ->through(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role?->slug,
                    'role_name' => $u->role?->name,
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
        return Inertia::render('Settings/Users/Create', [
            'roles' => $this->roleOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:'.User::class.',email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role_id' => ['required', Rule::exists('roles', 'id')],
        ]);

        User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role_id' => (int) $validated['role_id'],
        ]);

        return redirect()
            ->route('settings.users.index', $this->redirectQuery($request))
            ->with('status', 'user-created');
    }

    public function edit(Request $request, User $user): Response
    {
        if ($user->archived_at !== null) {
            abort(404);
        }

        $user->load('role');

        return Inertia::render('Settings/Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->slug,
                'role_id' => $user->role_id,
            ],
            'roles' => $this->roleOptions(),
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        if ($user->archived_at !== null) {
            abort(404);
        }

        $user->load('role');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'role_id' => ['required', Rule::exists('roles', 'id')],
        ]);

        $newRole = Role::query()->findOrFail((int) $validated['role_id']);

        if ($user->isAdmin() && $newRole->slug === 'user') {
            $otherActiveAdmins = User::query()
                ->active()
                ->whereHas('role', fn ($q) => $q->where('slug', 'admin'))
                ->where('id', '!=', $user->id)
                ->count();
            if ($otherActiveAdmins < 1) {
                return back()->withErrors([
                    'role_id' => 'At least one active administrator is required.',
                ])->onlyInput('role_id');
            }
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role_id = (int) $validated['role_id'];

        if (! empty($validated['password'])) {
            $user->password = $validated['password'];
        }

        $user->save();

        return redirect()
            ->route('settings.users.index', $this->redirectQuery($request))
            ->with('status', 'user-updated');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->archived_at !== null) {
            return redirect()
                ->route('settings.users.archive', $this->redirectQuery($request))
                ->with('status', 'user-already-archived');
        }

        if ($request->user()?->id === $user->id) {
            return redirect()
                ->route('settings.users.index', $this->redirectQuery($request))
                ->with('status', 'user-cannot-archive-self');
        }

        $user->load('role');

        if ($user->isAdmin()) {
            $otherActiveAdmins = User::query()
                ->active()
                ->whereHas('role', fn ($q) => $q->where('slug', 'admin'))
                ->where('id', '!=', $user->id)
                ->count();
            if ($otherActiveAdmins < 1) {
                return redirect()
                    ->route('settings.users.index', $this->redirectQuery($request))
                    ->with('status', 'user-last-admin');
            }
        }

        $user->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('settings.users.index', $this->redirectQuery($request))
            ->with('status', 'user-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = User::query()
            ->with('role')
            ->archived()
            ->whereHas('role', fn ($q) => $q->where('slug', '!=', 'admin'))
            ->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Settings/Users/Archive', [
            'users' => $query
                ->paginate($perPage)
                ->through(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role?->slug,
                    'role_name' => $u->role?->name,
                    'archived_at' => $u->archived_at?->toIso8601String(),
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function restore(Request $request, User $user): RedirectResponse
    {
        if ($user->archived_at === null) {
            return redirect()
                ->route('settings.users.index', $this->redirectQuery($request))
                ->with('status', 'user-not-archived');
        }

        $user->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('settings.users.archive', $this->redirectQuery($request))
            ->with('status', 'user-restored');
    }

    /**
     * @return list<array{id: int, name: string, slug: string}>
     */
    private function roleOptions(): array
    {
        return Role::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Role $r) => [
                'id' => $r->id,
                'name' => $r->name,
                'slug' => $r->slug,
            ])
            ->values()
            ->all();
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
