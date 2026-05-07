<?php

use App\Enums\UserRole;
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

        $slug = 'settings.user-accounts.manage';

        $permission = DB::table('permissions')
            ->where('slug', $slug)
            ->first();

        $now = now();

        if ($permission === null) {
            $id = DB::table('permissions')->insertGetId([
                'slug' => $slug,
                'name' => 'Settings — User accounts',
                'status' => 'active',
                'sort_order' => 39,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $id = $permission->id;
            DB::table('permissions')
                ->where('id', $id)
                ->update([
                    'name' => 'Settings — User accounts',
                    'status' => 'active',
                    'sort_order' => 39,
                    'updated_at' => $now,
                ]);
        }

        $alreadyLinked = DB::table('permission_role')
            ->where('role', UserRole::Admin->value)
            ->where('permission_id', $id)
            ->exists();

        if (! $alreadyLinked) {
            DB::table('permission_role')->insert([
                'role' => UserRole::Admin->value,
                'permission_id' => $id,
            ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $id = DB::table('permissions')->where('slug', 'settings.user-accounts.manage')->value('id');
        if ($id) {
            if (Schema::hasTable('permission_role')) {
                DB::table('permission_role')->where('permission_id', $id)->delete();
            }
            DB::table('permissions')->where('id', $id)->delete();
        }
    }
};
