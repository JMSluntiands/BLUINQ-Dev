<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RolePermissionController extends Controller
{
    public function edit(): Response
    {
        $permissions = Permission::query()
            ->where('status', 'active')
            ->orderBy('sort_order')
            ->get(['id', 'slug', 'name', 'status']);

        $roles = Role::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['slug', 'name']);

        $rolesForInertia = $roles->map(fn (Role $r) => [
            'value' => $r->slug,
            'label' => $r->name,
        ]);

        $assigned = [];
        foreach ($roles as $role) {
            $assigned[$role->slug] = Permission::slugsForRole($role->slug);
        }

        return Inertia::render('Settings/Permissions/Index', [
            'permissions' => $permissions,
            'roles' => $rolesForInertia,
            'assigned' => $assigned,
        ]);
    }

    public function update(Request $request): RedirectResponse
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
                return back()->withErrors([
                    'roles' => 'Administrator must keep access to Dashboard, User accounts, and Role permissions.',
                ]);
            }
        }

        foreach ($roleSlugs as $slug) {
            Permission::syncSlugsForRole($slug, $validated['roles'][$slug]);
        }

        return redirect()->route('settings.permissions.edit')->with('status', 'permissions-saved');
    }
}
