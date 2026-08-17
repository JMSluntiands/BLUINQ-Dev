<?php

namespace Tests\Feature;

use App\Models\Role;
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

    public function test_updating_user_position_copies_it_to_job_title(): void
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');
        $admin = User::factory()->create(['role_id' => $adminRoleId]);
        $member = User::factory()->create([
            'position' => 'Drafter',
            'job_title' => 'Drafter',
        ]);

        $this->actingAs($admin)
            ->post(route('settings.users.update', $member), [
                '_method' => 'patch',
                'name' => $member->name,
                'email' => $member->email,
                'role_id' => $member->role_id,
                'employment_status' => 'regular',
                'position' => 'Project Manager',
            ])
            ->assertRedirect();

        $member->refresh();
        $this->assertSame('Project Manager', $member->position);
        $this->assertSame('Project Manager', $member->job_title);

        $this->actingAs($admin)
            ->get(route('settings.users.show', $member))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Profile/Edit')
                ->where('profile.position', 'Project Manager')
                ->where('profile.job_title', 'Project Manager'));
    }

    public function test_profile_job_title_falls_back_to_position(): void
    {
        $user = User::factory()->create([
            'position' => 'Checker',
        ]);
        $user->forceFill(['job_title' => null])->saveQuietly();

        $this->actingAs($user)
            ->get('/profile')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Profile/Edit')
                ->where('profile.position', 'Checker')
                ->where('profile.job_title', 'Checker'));
    }
}
