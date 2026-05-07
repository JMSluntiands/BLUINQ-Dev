<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Api\Concerns\InteractsWithTableFilters;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserAccountController extends Controller
{
    use InteractsWithTableFilters;

    public function roleOptions(): JsonResponse
    {
        return response()->json(['roles' => $this->roles()]);
    }

    public function index(Request $request): JsonResponse
    {
        [$search, $perPage] = $this->tableFilters($request);

        $query = User::query()->active()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%');
            });
        }

        $paginator = $query
            ->paginate($perPage)
            ->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role->value,
            ])
            ->withQueryString();

        return response()->json($paginator);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
        ]);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        if ($user->archived_at !== null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'roles' => $this->roles(),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if ($user->archived_at !== null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

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
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        $newRole = UserRole::from($validated['role']);

        if ($user->role === UserRole::Admin && $newRole === UserRole::User) {
            $otherActiveAdmins = User::query()
                ->active()
                ->where('role', UserRole::Admin)
                ->where('id', '!=', $user->id)
                ->count();
            if ($otherActiveAdmins < 1) {
                return response()->json([
                    'message' => 'At least one active administrator is required.',
                    'errors' => ['role' => ['At least one active administrator is required.']],
                ], 422);
            }
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $newRole;

        if (! empty($validated['password'])) {
            $user->password = $validated['password'];
        }

        $user->save();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->archived_at !== null) {
            return response()->json(['message' => 'Already archived.'], 409);
        }

        if ($request->user()?->id === $user->id) {
            return response()->json(['message' => 'You cannot archive your own account.'], 422);
        }

        if ($user->role === UserRole::Admin) {
            $otherActiveAdmins = User::query()
                ->active()
                ->where('role', UserRole::Admin)
                ->where('id', '!=', $user->id)
                ->count();
            if ($otherActiveAdmins < 1) {
                return response()->json(['message' => 'Cannot archive the last active administrator.'], 422);
            }
        }

        $user->forceFill(['archived_at' => now()])->save();

        return response()->json(['message' => 'Archived.']);
    }

    public function archived(Request $request): JsonResponse
    {
        [$search, $perPage] = $this->tableFilters($request);

        $query = User::query()->archived()->orderByDesc('archived_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%');
            });
        }

        $paginator = $query
            ->paginate($perPage)
            ->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role->value,
                'archived_at' => $u->archived_at?->toIso8601String(),
            ])
            ->withQueryString();

        return response()->json($paginator);
    }

    public function restore(User $user): JsonResponse
    {
        if ($user->archived_at === null) {
            return response()->json(['message' => 'Not archived.'], 409);
        }

        $user->forceFill(['archived_at' => null])->save();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
        ]);
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function roles(): array
    {
        return collect(UserRole::cases())->map(fn (UserRole $role) => [
            'value' => $role->value,
            'label' => match ($role) {
                UserRole::Admin => 'Administrator',
                UserRole::User => 'Member',
            },
        ])->values()->all();
    }
}
