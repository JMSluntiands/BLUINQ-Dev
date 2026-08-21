<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();

        DB::table('permissions')->where('slug', 'timesheet.view-all')->update([
            'name' => 'View all team timesheets',
            'group_key' => 'general',
            'parent_slug' => 'timesheet.view',
            'sort_order' => 18,
            'status' => 'active',
            'updated_at' => $now,
        ]);

        // Keep leave permissions after timesheet so the child stays under Timesheet.
        $leaveOrders = [
            'leave.view' => 19,
            'leave.apply' => 20,
            'leave.manage' => 21,
            'leave.credits.view' => 22,
            'leave.credits.edit' => 23,
        ];

        foreach ($leaveOrders as $slug => $sortOrder) {
            DB::table('permissions')->where('slug', $slug)->update([
                'sort_order' => $sortOrder,
                'updated_at' => $now,
            ]);
        }

        $permissionId = DB::table('permissions')->where('slug', 'timesheet.view-all')->value('id');
        if ($permissionId === null || ! Schema::hasTable('permission_role')) {
            return;
        }

        foreach (['admin', 'project-manager'] as $role) {
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
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        DB::table('permissions')->where('slug', 'timesheet.view-all')->update([
            'name' => 'View all timesheets',
            'sort_order' => 18,
            'updated_at' => now(),
        ]);
    }
};
