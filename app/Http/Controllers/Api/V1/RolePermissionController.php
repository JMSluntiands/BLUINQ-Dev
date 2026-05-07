<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RolePermissionController extends Controller
{
    public function show(): JsonResponse
    {
        $permissions = Permission::query()
            ->where('status', 'active')
            ->orderBy('sort_order')
            ->get(['id', 'slug', 'name', 'status']);

        $roles = collect(UserRole::cases())->map(fn (UserRole $role) => [
            'value' => $role->value,
            'label' => match ($role) {
                UserRole::Admin => 'Administrator',
                UserRole::User => 'Member',
            },
        ]);

        $assigned = [];
        foreach (UserRole::cases() as $role) {
            $assigned[$role->value] = Permission::slugsForRole($role->value);
        }

        return response()->json([
            'permissions' => $permissions,
            'roles' => $roles,
            'assigned' => $assigned,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $permissionSlugs = Permission::query()
            ->where('status', 'active')
            ->pluck('slug')
            ->all();

        $validated = $request->validate([
            'roles' => ['required', 'array'],
            'roles.'.UserRole::Admin->value => ['required', 'array'],
            'roles.'.UserRole::Admin->value.'.*' => ['string', Rule::in($permissionSlugs)],
            'roles.'.UserRole::User->value => ['required', 'array'],
            'roles.'.UserRole::User->value.'.*' => ['string', Rule::in($permissionSlugs)],
        ]);

        $adminSlugs = $validated['roles'][UserRole::Admin->value];
        $requiredAdmin = [
            'dashboard.view',
            'settings.permissions.manage',
            'settings.user-accounts.manage',
        ];
        foreach ($requiredAdmin as $req) {
            if (! in_array($req, $adminSlugs, true)) {
                return response()->json([
                    'message' => 'Administrator must keep access to Dashboard, User accounts, and Role permissions.',
                    'errors' => ['roles' => ['Administrator must keep access to Dashboard, User accounts, and Role permissions.']],
                ], 422);
            }
        }

        Permission::syncSlugsForRole(UserRole::Admin->value, $adminSlugs);
        Permission::syncSlugsForRole(UserRole::User->value, $validated['roles'][UserRole::User->value]);

        return response()->json(['message' => 'Permissions saved.']);
    }
}
