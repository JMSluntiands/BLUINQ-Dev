<?php

namespace App\Http\Controllers\Settings;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Permission;
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

        return Inertia::render('Settings/Permissions/Index', [
            'permissions' => $permissions,
            'roles' => $roles,
            'assigned' => $assigned,
        ]);
    }

    public function update(Request $request): RedirectResponse
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
                return back()->withErrors([
                    'roles' => 'Administrator must keep access to Dashboard, User accounts, and Role permissions.',
                ]);
            }
        }

        Permission::syncSlugsForRole(UserRole::Admin->value, $adminSlugs);
        Permission::syncSlugsForRole(UserRole::User->value, $validated['roles'][UserRole::User->value]);

        return redirect()->route('settings.permissions.edit')->with('status', 'permissions-saved');
    }
}
