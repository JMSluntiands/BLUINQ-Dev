<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @var list<string>
     */
    private array $newSlugs = [
        'announcements.view',
        'announcements.manage',
        'timesheet.view',
        'job.list.view',
        'job.drafting-request.view',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();

        DB::table('permissions')->where('slug', 'dashboard.view')->update([
            'name' => 'Dashboard',
            'group_key' => 'general',
            'parent_slug' => null,
            'updated_at' => $now,
        ]);

        $rows = [
            [
                'slug' => 'announcements.view',
                'name' => 'Announcements',
                'group_key' => 'general',
                'parent_slug' => null,
                'sort_order' => 15,
            ],
            [
                'slug' => 'announcements.manage',
                'name' => 'Post announcements',
                'group_key' => 'general',
                'parent_slug' => 'announcements.view',
                'sort_order' => 16,
            ],
            [
                'slug' => 'timesheet.view',
                'name' => 'Timesheet',
                'group_key' => 'general',
                'parent_slug' => null,
                'sort_order' => 17,
            ],
            [
                'slug' => 'job.list.view',
                'name' => 'Job list',
                'group_key' => 'archi-project',
                'parent_slug' => null,
                'sort_order' => 90,
            ],
            [
                'slug' => 'job.drafting-request.view',
                'name' => 'Draft request form',
                'group_key' => 'archi-project',
                'parent_slug' => null,
                'sort_order' => 95,
            ],
        ];

        foreach ($rows as $row) {
            $existing = DB::table('permissions')->where('slug', $row['slug'])->first();

            if ($existing) {
                DB::table('permissions')->where('slug', $row['slug'])->update([
                    'name' => $row['name'],
                    'group_key' => $row['group_key'],
                    'parent_slug' => $row['parent_slug'],
                    'sort_order' => $row['sort_order'],
                    'status' => 'active',
                    'updated_at' => $now,
                ]);
                $permissionId = $existing->id;
            } else {
                $permissionId = DB::table('permissions')->insertGetId([
                    'slug' => $row['slug'],
                    'name' => $row['name'],
                    'status' => 'active',
                    'group_key' => $row['group_key'],
                    'parent_slug' => $row['parent_slug'],
                    'sort_order' => $row['sort_order'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $this->attachToRole('admin', $permissionId);

            if (in_array($row['slug'], [
                'announcements.view',
                'timesheet.view',
                'job.list.view',
                'job.drafting-request.view',
            ], true)) {
                $this->attachToRole('user', $permissionId);
            }
        }

        $this->grantNavigationPermissionsToExistingRoles();
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $ids = DB::table('permissions')->whereIn('slug', $this->newSlugs)->pluck('id');

        if ($ids->isNotEmpty() && Schema::hasTable('permission_role')) {
            DB::table('permission_role')->whereIn('permission_id', $ids)->delete();
        }

        DB::table('permissions')->whereIn('slug', $this->newSlugs)->delete();
    }

    private function grantNavigationPermissionsToExistingRoles(): void
    {
        if (! Schema::hasTable('permission_role')) {
            return;
        }

        $dashboardPermissionId = DB::table('permissions')
            ->where('slug', 'dashboard.view')
            ->value('id');

        if ($dashboardPermissionId === null) {
            return;
        }

        $rolesWithDashboard = DB::table('permission_role')
            ->where('permission_id', $dashboardPermissionId)
            ->pluck('role')
            ->unique()
            ->all();

        $legacyJobSlugs = ['job.list.view', 'job.drafting-request.view'];

        foreach ($rolesWithDashboard as $role) {
            foreach ($legacyJobSlugs as $slug) {
                $permissionId = DB::table('permissions')->where('slug', $slug)->value('id');
                if ($permissionId !== null) {
                    $this->attachToRole($role, (int) $permissionId);
                }
            }
        }

        $profilePermissionId = DB::table('permissions')
            ->where('slug', 'profile.view')
            ->value('id');

        if ($profilePermissionId === null) {
            return;
        }

        $rolesWithProfile = DB::table('permission_role')
            ->where('permission_id', $profilePermissionId)
            ->pluck('role')
            ->unique()
            ->all();

        $timesheetPermissionId = DB::table('permissions')
            ->where('slug', 'timesheet.view')
            ->value('id');

        if ($timesheetPermissionId === null) {
            return;
        }

        foreach ($rolesWithProfile as $role) {
            $this->attachToRole($role, (int) $timesheetPermissionId);
        }
    }

    private function attachToRole(string $role, int $permissionId): void
    {
        $exists = DB::table('permission_role')
            ->where('role', $role)
            ->where('permission_id', $permissionId)
            ->exists();

        if (! $exists) {
            DB::table('permission_role')->insert([
                'role' => $role,
                'permission_id' => $permissionId,
            ]);
        }
    }
};
