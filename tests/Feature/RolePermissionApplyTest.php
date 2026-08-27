<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionApplyTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_with_user_accounts_permission_can_open_users_index(): void
    {
        $memberRoleId = Role::query()->where('slug', 'user')->value('id');
        $user = User::factory()->create([
            'role_id' => $memberRoleId,
        ]);

        Permission::syncSlugsForRole('user', [
            'dashboard.view',
            'settings.user-accounts.manage',
        ]);

        $this->actingAs($user)
            ->get(route('settings.users.index'))
            ->assertOk();
    }

    public function test_member_without_user_accounts_permission_is_forbidden(): void
    {
        $memberRoleId = Role::query()->where('slug', 'user')->value('id');
        $user = User::factory()->create([
            'role_id' => $memberRoleId,
        ]);

        Permission::syncSlugsForRole('user', [
            'dashboard.view',
        ]);

        $this->actingAs($user)
            ->get(route('settings.users.index'))
            ->assertForbidden();
    }

    public function test_member_with_user_accounts_only_cannot_open_roles_index(): void
    {
        $memberRoleId = Role::query()->where('slug', 'user')->value('id');
        $user = User::factory()->create([
            'role_id' => $memberRoleId,
        ]);

        Permission::syncSlugsForRole('user', [
            'dashboard.view',
            'settings.user-accounts.manage',
        ]);

        $this->actingAs($user)
            ->get(route('settings.roles.index'))
            ->assertForbidden();
    }

    public function test_member_with_roles_permission_can_open_roles_index(): void
    {
        $memberRoleId = Role::query()->where('slug', 'user')->value('id');
        $user = User::factory()->create([
            'role_id' => $memberRoleId,
        ]);

        Permission::syncSlugsForRole('user', [
            'dashboard.view',
            'settings.roles.manage',
        ]);

        $this->actingAs($user)
            ->get(route('settings.roles.index'))
            ->assertOk();
    }
}
