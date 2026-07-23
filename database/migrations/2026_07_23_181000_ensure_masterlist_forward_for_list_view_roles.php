<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('permissions') || ! Schema::hasTable('permission_role')) {
            return;
        }

        $now = now();

        $existing = DB::table('permissions')->where('slug', 'job.masterlist.forward')->first();

        if ($existing) {
            $permissionId = (int) $existing->id;
            DB::table('permissions')->where('id', $permissionId)->update([
                'name' => 'Forward masterlist to APM',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting-request.view',
                'sort_order' => 97,
                'status' => 'active',
                'updated_at' => $now,
            ]);
        } else {
            $permissionId = (int) DB::table('permissions')->insertGetId([
                'slug' => 'job.masterlist.forward',
                'name' => 'Forward masterlist to APM',
                'status' => 'active',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting-request.view',
                'sort_order' => 97,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $listViewPermissionId = DB::table('permissions')
            ->where('slug', 'job.list.view')
            ->value('id');

        $roles = collect(['admin']);

        if ($listViewPermissionId) {
            $roles = $roles->merge(
                DB::table('permission_role')
                    ->where('permission_id', $listViewPermissionId)
                    ->pluck('role'),
            );
        }

        foreach ($roles->unique()->filter()->values() as $role) {
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
        // Keep the permission; only the attach-to-list-view-roles sync is repaired here.
    }
};
