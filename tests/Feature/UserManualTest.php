<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManualTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_open_user_manual(): void
    {
        $memberRoleId = Role::query()->where('slug', 'user')->value('id');

        $user = User::factory()->create([
            'role_id' => $memberRoleId,
        ]);

        $this->actingAs($user)
            ->get(route('settings.user-manual'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Settings/UserManual/Index'));
    }

    public function test_guest_is_redirected_from_user_manual(): void
    {
        $this->get(route('settings.user-manual'))
            ->assertRedirect();
    }
}
