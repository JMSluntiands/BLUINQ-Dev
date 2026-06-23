<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $slug = 'leave.credits.manage';

    public function up(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();

        $existing = DB::table('permissions')->where('slug', $this->slug)->first();

        if ($existing) {
            DB::table('permissions')->where('slug', $this->slug)->update([
                'name' => 'Manage leave credits',
                'group_key' => 'general',
                'parent_slug' => 'leave.view',
                'sort_order' => 21,
                'status' => 'active',
                'updated_at' => $now,
            ]);
            $permissionId = $existing->id;
        } else {
            $permissionId = DB::table('permissions')->insertGetId([
                'slug' => $this->slug,
                'name' => 'Manage leave credits',
                'status' => 'active',
                'group_key' => 'general',
                'parent_slug' => 'leave.view',
                'sort_order' => 21,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->attachToRole('admin', (int) $permissionId);
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $id = DB::table('permissions')->where('slug', $this->slug)->value('id');

        if ($id && Schema::hasTable('permission_role')) {
            DB::table('permission_role')->where('permission_id', $id)->delete();
        }

        DB::table('permissions')->where('slug', $this->slug)->delete();
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
