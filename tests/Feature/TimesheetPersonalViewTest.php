<?php

namespace Tests\Feature;

use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestAssignment;
use App\Models\Permission;
use App\Models\Role;
use App\Models\StoreyLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TimesheetPersonalViewTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sees_team_timesheet_summary(): void
    {
        $admin = $this->adminUser();

        User::factory()->create(['name' => 'Team Member A']);
        User::factory()->create(['name' => 'Team Member B']);

        $this->actingAs($admin)
            ->get(route('timesheet.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Timesheet/Index')
                ->where('mode', 'team')
                ->has('leaveCalendar', 3)
                ->where('weeklyTimesheet', null));
    }

    public function test_regular_user_sees_only_their_leave_calendar(): void
    {
        $member = User::factory()->create([
            'name' => 'Member User',
            'employment_status' => 'regular',
            'holiday_region' => 'philippines',
        ]);

        User::factory()->create(['name' => 'Other User']);

        $this->actingAs($member)
            ->get(route('timesheet.index', ['calendar_month' => '2026-08']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Timesheet/Index')
                ->where('mode', 'personal')
                ->has('leaveCalendar', 1)
                ->where('leaveCalendar.0.name', 'Member User')
                ->where('weeklyTimesheet', null));
    }

    public function test_drafting_connected_user_sees_weekly_timesheet_with_overtime(): void
    {
        $owner = $this->adminUser();
        $member = User::factory()->create([
            'name' => 'Drafter User',
            'employment_status' => 'regular',
        ]);

        [$storeyLevel, $category] = $this->seedLookups();

        $job = DraftingRequest::query()->create([
            'user_id' => $owner->id,
            'status' => DraftingRequest::STATUS_NEW,
            'review_status' => DraftingRequest::REVIEW_ACCEPTED,
            'workflow_stage' => DraftingRequest::STAGE_APM,
            'requested_at' => now(),
            'your_name' => 'Test Client',
            'company_name' => 'Test Co',
            'email' => 'test@example.com',
            'site_address' => '1 Draft St',
            'site_owner_name' => 'Owner',
            'storey_level_id' => $storeyLevel->id,
            'crm_category_id' => $category->id,
            'ceiling_heights' => '2700',
            'ndis_sda' => false,
        ]);

        DraftingRequestAssignment::query()->create([
            'drafting_request_id' => $job->id,
            'role' => DraftingRequestAssignment::ROLE_DRAFTING,
            'slot' => 1,
            'user_id' => $member->id,
            'hours' => 0,
        ]);

        $this->actingAs($member)
            ->get(route('timesheet.index', ['week' => '2026-08-18']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Timesheet/Index')
                ->where('mode', 'weekly')
                ->has('weeklyTimesheet.week_start')
                ->has('weeklyTimesheet.rows')
                ->has('weeklyTimesheet.standard_tasks'));
    }

    public function test_hr_user_with_leave_manage_sees_team_timesheet_summary(): void
    {
        $this->grantPermissionToUserRole('leave.manage');

        $hrUser = User::factory()->create([
            'employment_status' => 'regular',
        ]);

        User::factory()->create(['name' => 'Team Member']);

        $this->actingAs($hrUser)
            ->get(route('timesheet.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Timesheet/Index')
                ->where('mode', 'team')
                ->has('leaveCalendar', 2));
    }

    /**
     * @return array{0: StoreyLevel, 1: CrmCategory}
     */
    private function seedLookups(): array
    {
        $storeyLevel = StoreyLevel::query()->create([
            'code' => '2s',
            'name' => '2 storeys',
            'status' => 'active',
        ]);

        $category = CrmCategory::query()->create([
            'code' => 'WD',
            'name' => 'Working Drawings',
            'status' => 'active',
        ]);

        return [$storeyLevel, $category];
    }

    private function grantPermissionToUserRole(string $slug): void
    {
        $permissionId = Permission::query()->where('slug', $slug)->value('id');

        if ($permissionId === null) {
            return;
        }

        DB::table('permission_role')->insertOrIgnore([
            'role' => 'user',
            'permission_id' => $permissionId,
        ]);
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
