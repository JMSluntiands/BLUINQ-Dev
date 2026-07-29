<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Project managers need Dashboard (and related clock-in) access.
     */
    public function up(): void
    {
        $slugs = [
            'dashboard.view',
            'timesheet.view',
            'job.list.view',
            'profile.view',
        ];

        $permissionIds = DB::table('permissions')
            ->whereIn('slug', $slugs)
            ->where('status', 'active')
            ->pluck('id', 'slug');

        foreach ($permissionIds as $permissionId) {
            $exists = DB::table('permission_role')
                ->where('role', 'project-manager')
                ->where('permission_id', $permissionId)
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('permission_role')->insert([
                'role' => 'project-manager',
                'permission_id' => $permissionId,
            ]);
        }
    }

    public function down(): void
    {
        // Keep manager access; do not revoke on rollback.
    }
};
