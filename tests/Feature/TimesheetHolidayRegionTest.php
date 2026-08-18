<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimesheetHolidayRegionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_a_users_holiday_region(): void
    {
        $admin = $this->adminUser();
        $member = User::factory()->create([
            'employment_status' => 'regular',
            'holiday_region' => 'philippines',
        ]);

        $this->actingAs($admin)
            ->patch(route('settings.users.update', $member), [
                'name' => $member->name,
                'email' => $member->email,
                'role_id' => $member->role_id,
                'employment_status' => 'regular',
                'holiday_region' => 'singapore',
            ])
            ->assertRedirect();

        $member->refresh();

        $this->assertSame('singapore', $member->holiday_region);
    }

    public function test_timesheet_uses_each_users_holiday_region_in_team_view(): void
    {
        $admin = $this->adminUser();

        User::factory()->create([
            'name' => 'PH User',
            'employment_status' => 'regular',
            'holiday_region' => 'philippines',
        ]);

        User::factory()->create([
            'name' => 'SG User',
            'employment_status' => 'regular',
            'holiday_region' => 'singapore',
        ]);

        $response = $this->actingAs($admin)
            ->get(route('timesheet.index', ['calendar_month' => '2026-08']));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Timesheet/Index')
            ->where('mode', 'team')
            ->has('leaveCalendar', 3)
            ->where('leaveCalendar', function ($rows) {
                $ph = collect($rows)->firstWhere('name', 'PH User');
                $sg = collect($rows)->firstWhere('name', 'SG User');

                return $ph !== null
                    && ($ph['holiday_marks']['2026-08-21']['country'] ?? null) === 'ph'
                    && ($ph['holiday_marks']['2026-08-21']['name'] ?? null) === 'Ninoy Aquino Day'
                    && $sg !== null
                    && ($sg['holiday_marks']['2026-08-10']['country'] ?? null) === 'sg'
                    && ($sg['holiday_marks']['2026-08-10']['name'] ?? null) === 'National Day (observed)';
            }));
    }

    private function adminUser(): User
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        return User::factory()->create([
            'role_id' => $adminRoleId,
            'employment_status' => 'regular',
        ]);
    }
}
