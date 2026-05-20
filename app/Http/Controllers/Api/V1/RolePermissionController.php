<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
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

        $roles = Role::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['slug', 'name'])
            ->map(fn (Role $r) => [
                'value' => $r->slug,
                'label' => $r->name,
            ]);

        $assigned = [];
        foreach (Role::query()->orderBy('sort_order')->orderBy('name')->get() as $role) {
            $assigned[$role->slug] = Permission::slugsForRole($role->slug);
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

        $roleSlugs = Role::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->pluck('slug')
            ->all();

        $rules = [
            'roles' => ['required', 'array'],
        ];

        foreach ($roleSlugs as $slug) {
            $rules['roles.'.$slug] = ['required', 'array'];
            $rules['roles.'.$slug.'.*'] = ['string', Rule::in($permissionSlugs)];
        }

        $validated = $request->validate($rules);

        $adminSlugs = $validated['roles']['admin'] ?? [];
        $requiredAdmin = [
            'dashboard.view',
            'settings.permissions.manage',
            'settings.user-accounts.manage',
            'settings.roles.manage',
        ];
        $requiredAdmin = array_values(array_filter(
            $requiredAdmin,
            fn (string $slug) => in_array($slug, $permissionSlugs, true),
        ));
        foreach ($requiredAdmin as $req) {
            if (! in_array($req, $adminSlugs, true)) {
                return response()->json([
                    'message' => 'Administrator must keep access to Dashboard, User accounts, and Role permissions.',
                    'errors' => ['roles' => ['Administrator must keep access to Dashboard, User accounts, and Role permissions.']],
                ], 422);
            }
        }

        foreach ($roleSlugs as $slug) {
            Permission::syncSlugsForRole($slug, $validated['roles'][$slug]);
        }

        return response()->json(['message' => 'Permissions saved.']);
    }
}
