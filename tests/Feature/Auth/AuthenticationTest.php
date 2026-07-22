<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_cannot_authenticate_when_archived(): void
    {
        $user = User::factory()->create([
            'archived_at' => now(),
        ]);

        $this->post('/', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }

    public function test_stale_csrf_on_logout_still_ends_the_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user);
        $this->withSession(['_token' => 'valid-session-token']);

        $response = $this
            ->withHeader('X-Inertia', 'true')
            ->withHeader('X-XSRF-TOKEN', 'stale-token')
            ->post('/logout', ['_token' => 'stale-token']);

        $this->assertGuest();
        $response->assertStatus(409);
        $this->assertTrue(
            in_array($response->headers->get('X-Inertia-Location'), [url('/'), '/'], true),
            'Expected Inertia location to the login page.',
        );
    }
}
