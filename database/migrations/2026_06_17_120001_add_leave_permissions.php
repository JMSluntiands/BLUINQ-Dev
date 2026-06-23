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
        'leave.view',
        'leave.apply',
        'leave.manage',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();

        $rows = [
            [
                'slug' => 'leave.view',
                'name' => 'Team leave calendar',
                'group_key' => 'general',
                'parent_slug' => null,
                'sort_order' => 18,
            ],
            [
                'slug' => 'leave.apply',
                'name' => 'Apply for leave',
                'group_key' => 'general',
                'parent_slug' => 'leave.view',
                'sort_order' => 19,
            ],
            [
                'slug' => 'leave.manage',
                'name' => 'Approve leave requests',
                'group_key' => 'general',
                'parent_slug' => 'leave.view',
                'sort_order' => 20,
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

            if (in_array($row['slug'], ['leave.view', 'leave.apply'], true)) {
                $this->attachToRole('user', $permissionId);
            }
        }

        $this->grantLeaveViewToDashboardRoles();
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

    private function grantLeaveViewToDashboardRoles(): void
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

        foreach ($rolesWithDashboard as $role) {
            foreach (['leave.view', 'leave.apply'] as $slug) {
                $permissionId = DB::table('permissions')->where('slug', $slug)->value('id');
                if ($permissionId !== null) {
                    $this->attachToRole($role, (int) $permissionId);
                }
            }
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
