<?php

namespace Tests\Feature;

use App\Models\PasswordChangeRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordChangeRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_a_password_change_from_their_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/profile')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Profile/Edit')
                ->where('passwordRequest', null));

        $this->actingAs($user)
            ->post(route('profile.password-request.store'), [
                'current_password' => 'password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertRedirect(route('profile.edit'))
            ->assertSessionHas('status', 'password-change-requested');

        $request = PasswordChangeRequest::query()->where('user_id', $user->id)->first();
        $this->assertNotNull($request);
        $this->assertSame(PasswordChangeRequest::STATUS_PENDING, $request->status);
        $this->assertTrue(Hash::check('new-password', $request->password));
        $this->assertTrue(Hash::check('password', $user->fresh()->password));

        $this->actingAs($user)
            ->get('/profile')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('passwordRequest.status', 'pending'));
    }

    public function test_a_new_request_replaces_the_pending_one(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('profile.password-request.store'), [
            'current_password' => 'password',
            'password' => 'first-password',
            'password_confirmation' => 'first-password',
        ])->assertRedirect();

        $this->actingAs($user)->post(route('profile.password-request.store'), [
            'current_password' => 'password',
            'password' => 'second-password',
            'password_confirmation' => 'second-password',
        ])->assertRedirect();

        $requests = PasswordChangeRequest::query()->where('user_id', $user->id)->get();
        $this->assertCount(2, $requests);
        $this->assertSame(1, $requests->where('status', PasswordChangeRequest::STATUS_PENDING)->count());
        $this->assertSame(1, $requests->where('status', PasswordChangeRequest::STATUS_CANCELLED)->count());
        $this->assertTrue(Hash::check(
            'second-password',
            $requests->firstWhere('status', PasswordChangeRequest::STATUS_PENDING)->password,
        ));
    }

    public function test_request_requires_the_current_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/profile')
            ->post(route('profile.password-request.store'), [
                'current_password' => 'wrong-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertRedirect('/profile')
            ->assertSessionHasErrors('current_password');

        $this->assertSame(0, PasswordChangeRequest::query()->count());
    }

    public function test_admin_approval_applies_the_requested_password(): void
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');
        $admin = User::factory()->create(['role_id' => $adminRoleId]);
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('profile.password-request.store'), [
            'current_password' => 'password',
            'password' => 'approved-password',
            'password_confirmation' => 'approved-password',
        ])->assertRedirect();

        $changeRequest = PasswordChangeRequest::query()->where('user_id', $user->id)->firstOrFail();

        $this->actingAs($admin)
            ->post(route('settings.password-requests.approve', $changeRequest))
            ->assertRedirect();

        $this->assertTrue(Hash::check('approved-password', $user->fresh()->password));
        $this->assertSame(
            PasswordChangeRequest::STATUS_APPROVED,
            $changeRequest->fresh()->status,
        );
    }

    public function test_viewing_another_user_does_not_show_the_request_button_data(): void
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');
        $admin = User::factory()->create(['role_id' => $adminRoleId]);
        $member = User::factory()->create();

        $this->actingAs($admin)
            ->get(route('settings.users.show', $member))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Profile/Edit')
                ->missing('passwordRequest')
                ->has('editAccountUrl'));
    }
}
