<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use App\Support\AppClock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PhilippineTimeTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_log_times_are_shown_in_philippine_time(): void
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');
        $admin = User::factory()->create(['role_id' => $adminRoleId]);

        $log = ActivityLog::query()->create([
            'user_id' => $admin->id,
            'method' => 'POST',
            'route_name' => 'example.update',
            'path' => '/example',
            'status_code' => 200,
        ]);
        $log->created_at = Carbon::parse('2026-10-08 13:33:33', 'UTC');
        $log->save();

        $this->actingAs($admin)
            ->get(route('settings.activity-logs.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Settings/ActivityLogs/Index')
                ->where('logs.data', function ($rows) {
                    return collect($rows)->contains(
                        fn ($row) => ($row['route_name'] ?? null) === 'example.update'
                            && ($row['created_at'] ?? null) === 'Oct 8, 2026 9:33 PM',
                    );
                }));
    }

    public function test_a_form_datetime_is_stored_as_utc_and_read_as_philippine_time(): void
    {
        $stored = AppClock::localToUtcString('2026-10-12T13:40');

        $this->assertSame('2026-10-12 05:40:00', $stored);
        $this->assertSame(
            'Oct 12, 2026 1:40 PM',
            Carbon::parse($stored, 'UTC')->timezone(AppClock::timezone())->format('M j, Y g:i A'),
        );
    }
}
