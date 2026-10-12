<?php

namespace Tests\Feature;

use App\Models\LeaveRequest;
use App\Models\PublicHoliday;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicHolidayTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_add_holidays_for_ph_sg_and_australia(): void
    {
        $admin = $this->adminUser();

        foreach ([
            'philippines' => 'Foundation Day',
            'singapore' => 'Company Day',
            'western_australia' => 'State Holiday',
        ] as $region => $name) {
            $this->actingAs($admin)
                ->post(route('public-holidays.store'), [
                    'region' => $region,
                    'holiday_date' => '2026-10-15',
                    'name' => $name,
                ])
                ->assertRedirect();
        }

        $this->assertDatabaseHas('public_holidays', [
            'region' => 'philippines',
            'name' => 'Foundation Day',
        ]);
        $this->assertDatabaseHas('public_holidays', [
            'region' => 'singapore',
            'name' => 'Company Day',
        ]);
        $this->assertDatabaseHas('public_holidays', [
            'region' => 'western_australia',
            'name' => 'State Holiday',
        ]);

        $this->actingAs($admin)
            ->get(route('dashboard', ['calendar_month' => '2026-10']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('holidays.2026-10-15', function ($rows) {
                    $names = collect($rows)->pluck('name')->all();

                    return in_array('Foundation Day', $names, true)
                        && in_array('Company Day', $names, true)
                        && in_array('State Holiday', $names, true);
                }));
    }

    public function test_manual_holiday_is_skipped_on_leave_and_shown_on_the_timesheet(): void
    {
        $admin = $this->adminUser();

        PublicHoliday::query()->create([
            'region' => 'philippines',
            'holiday_date' => '2026-10-12',
            'name' => 'Special Non-Working Day',
            'user_id' => $admin->id,
        ]);

        User::factory()->create([
            'name' => 'PH Staff',
            'employment_status' => 'regular',
            'holiday_region' => 'philippines',
        ]);

        $this->assertSame(
            1.0,
            LeaveRequest::calculateRequestedDays(
                '2026-10-12',
                '2026-10-13',
                'morning',
                'afternoon',
                'philippines',
            ),
        );

        $this->actingAs($admin)
            ->get(route('timesheet.index', ['calendar_month' => '2026-10']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('leaveCalendar', function ($rows) {
                    $staff = collect($rows)->firstWhere('name', 'PH Staff');

                    return $staff !== null
                        && ($staff['holiday_marks']['2026-10-12']['name'] ?? null) === 'Special Non-Working Day'
                        && ($staff['holiday_marks']['2026-10-12']['country'] ?? null) === 'ph';
                }));
    }

    public function test_non_admin_cannot_add_or_remove_a_holiday(): void
    {
        $member = User::factory()->create([
            'employment_status' => 'regular',
        ]);
        $holiday = PublicHoliday::query()->create([
            'region' => 'singapore',
            'holiday_date' => '2026-10-16',
            'name' => 'Extra Day',
            'user_id' => $member->id,
        ]);

        $this->actingAs($member)
            ->post(route('public-holidays.store'), [
                'region' => 'singapore',
                'holiday_date' => '2026-10-20',
                'name' => 'Blocked Day',
            ])
            ->assertForbidden();

        $this->actingAs($member)
            ->delete(route('public-holidays.destroy', $holiday))
            ->assertForbidden();

        $this->assertDatabaseHas('public_holidays', ['id' => $holiday->id]);
    }

    public function test_admin_can_remove_a_manual_holiday_and_cannot_duplicate_a_listed_one(): void
    {
        $admin = $this->adminUser();
        $holiday = PublicHoliday::query()->create([
            'region' => 'philippines',
            'holiday_date' => '2026-10-16',
            'name' => 'Extra Day',
            'user_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->delete(route('public-holidays.destroy', $holiday))
            ->assertRedirect();

        $this->assertDatabaseMissing('public_holidays', ['id' => $holiday->id]);

        $this->actingAs($admin)
            ->from(route('dashboard'))
            ->post(route('public-holidays.store'), [
                'region' => 'philippines',
                'holiday_date' => '2026-08-21',
                'name' => 'Ninoy Aquino Day',
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHasErrors('name');
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
