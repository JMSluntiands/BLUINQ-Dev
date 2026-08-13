<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Profile/Edit')
            ->where('canViewPrivate', true)
            ->has('profile.leave_balances'));
    }

    public function test_admin_can_see_private_profile_fields(): void
    {
        $adminRoleId = \App\Models\Role::query()->where('slug', 'admin')->value('id');

        $admin = User::factory()->create([
            'role_id' => $adminRoleId,
            'date_hired' => '2026-07-24',
            'claims_excel_url' => 'https://example.com/claims',
        ]);

        $response = $this
            ->actingAs($admin)
            ->get('/profile');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Profile/Edit')
            ->where('canViewPrivate', true)
            ->where('profile.date_hired', '2026-07-24')
            ->where('profile.claims_excel_url', 'https://example.com/claims')
            ->has('profile.leave_balances'));
    }

    public function test_admin_can_view_another_user_profile_from_accounts_list(): void
    {
        $adminRoleId = \App\Models\Role::query()->where('slug', 'admin')->value('id');

        $admin = User::factory()->create([
            'role_id' => $adminRoleId,
        ]);

        $member = User::factory()->create([
            'name' => 'Member User',
            'date_hired' => '2026-01-15',
            'claims_excel_url' => 'https://example.com/member-claims',
        ]);

        $response = $this
            ->actingAs($admin)
            ->get(route('settings.users.show', $member));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Profile/Edit')
            ->where('canViewPrivate', true)
            ->where('profile.name', 'Member User')
            ->where('profile.date_hired', '2026-01-15')
            ->where('profile.claims_excel_url', 'https://example.com/member-claims')
            ->has('backUrl')
            ->has('editAccountUrl'));
    }

    public function test_users_cannot_update_their_own_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'original@example.com',
        ]);

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response->assertMethodNotAllowed();

        $user->refresh();

        $this->assertSame('Original Name', $user->name);
        $this->assertSame('original@example.com', $user->email);
    }

    public function test_users_cannot_request_a_password_change(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->put('/password', [
                'current_password' => 'password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response->assertNotFound();
    }

    public function test_api_users_cannot_update_profile_or_password(): void
    {
        $user = User::factory()->create([
            'name' => 'Original Name',
        ]);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/v1/profile', [
                'name' => 'Hacked Name',
                'email' => $user->email,
            ])
            ->assertMethodNotAllowed();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/profile/password', [
                'current_password' => 'password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertNotFound();

        $this->assertSame('Original Name', $user->fresh()->name);
    }
}
