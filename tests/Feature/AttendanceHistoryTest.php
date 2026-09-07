<?php

namespace Tests\Feature;

use App\Models\AttendanceClock;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AttendanceHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_hr_with_permission_can_view_attendance_history(): void
    {
        $this->grantPermissionToUserRole('attendance.history.view');

        $hr = User::factory()->create(['name' => 'HR User']);
        $staff = User::factory()->create(['name' => 'Staff Member']);

        AttendanceClock::query()->create([
            'user_id' => $staff->id,
            'work_date' => '2026-09-05',
            'clock_in_at' => '2026-09-05 00:05:00',
            'clock_out_at' => '2026-09-05 09:00:00',
        ]);

        $this->actingAs($hr)
            ->get(route('attendance.history', [
                'from' => '2026-09-01',
                'to' => '2026-09-07',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Attendance/History')
                ->has('records.data', 1)
                ->where('records.data.0.user.name', 'Staff Member')
                ->where('records.data.0.status', 'clocked_out'));
    }

    public function test_leave_manage_alone_does_not_grant_attendance_history(): void
    {
        $this->grantPermissionToUserRole('leave.manage');

        $hr = User::factory()->create(['name' => 'Leave Manager']);

        $this->actingAs($hr)
            ->get(route('attendance.history'))
            ->assertForbidden();
    }

    public function test_user_without_permission_cannot_view_attendance_history(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('attendance.history'))
            ->assertForbidden();
    }

    public function test_admin_can_view_attendance_history(): void
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');
        $admin = User::factory()->create(['role_id' => $adminRoleId]);

        $this->actingAs($admin)
            ->get(route('attendance.history'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Attendance/History'));
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
}
