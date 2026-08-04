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

        $slug = 'job.list.edit';
        $now = now();

        $payload = [
            'name' => 'Edit board table',
            'status' => 'active',
            'sort_order' => 91,
            'updated_at' => $now,
        ];

        if (Schema::hasColumn('permissions', 'group_key')) {
            $payload['group_key'] = 'archi-project';
            $payload['parent_slug'] = 'job.list.view';
        }

        $permission = DB::table('permissions')->where('slug', $slug)->first();

        if ($permission === null) {
            $id = DB::table('permissions')->insertGetId(array_merge($payload, [
                'slug' => $slug,
                'created_at' => $now,
            ]));
        } else {
            $id = (int) $permission->id;
            DB::table('permissions')->where('id', $id)->update($payload);
        }

        $roles = collect([
            UserRole::Admin->value,
            'project-manager',
        ]);

        $jobListPermissionId = DB::table('permissions')
            ->where('slug', 'job.list.view')
            ->value('id');

        if ($jobListPermissionId) {
            $roles = $roles->merge(
                DB::table('permission_role')
                    ->where('permission_id', $jobListPermissionId)
                    ->pluck('role'),
            );
        }

        foreach ($roles->unique()->filter() as $role) {
            $exists = DB::table('permission_role')
                ->where('role', $role)
                ->where('permission_id', $id)
                ->exists();

            if (! $exists) {
                DB::table('permission_role')->insert([
                    'role' => $role,
                    'permission_id' => $id,
                ]);
            }
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $id = DB::table('permissions')
            ->where('slug', 'job.list.edit')
            ->value('id');

        if (! $id) {
            return;
        }

        if (Schema::hasTable('permission_role')) {
            DB::table('permission_role')->where('permission_id', $id)->delete();
        }

        DB::table('permissions')->where('id', $id)->delete();
    }
};
