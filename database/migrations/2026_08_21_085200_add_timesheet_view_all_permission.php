<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $slug = 'timesheet.view-all';

    public function up(): void
    {
        if (! Schema::hasTable('permissions') || ! Schema::hasTable('permission_role')) {
            return;
        }

        $now = now();
        $payload = [
            'name' => 'View all timesheets',
            'status' => 'active',
            'sort_order' => 18,
            'updated_at' => $now,
        ];

        if (Schema::hasColumn('permissions', 'group_key')) {
            $payload['group_key'] = 'general';
            $payload['parent_slug'] = 'timesheet.view';
        }

        $permission = DB::table('permissions')->where('slug', $this->slug)->first();

        if ($permission === null) {
            $id = (int) DB::table('permissions')->insertGetId(array_merge($payload, [
                'slug' => $this->slug,
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

        $leaveManageId = DB::table('permissions')
            ->where('slug', 'leave.manage')
            ->value('id');

        if ($leaveManageId) {
            $roles = $roles->merge(
                DB::table('permission_role')
                    ->where('permission_id', $leaveManageId)
                    ->pluck('role'),
            );
        }

        foreach ($roles->unique()->filter() as $role) {
            $this->attachToRole((string) $role, $id);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $id = DB::table('permissions')->where('slug', $this->slug)->value('id');

        if (! $id) {
            return;
        }

        if (Schema::hasTable('permission_role')) {
            DB::table('permission_role')->where('permission_id', $id)->delete();
        }

        DB::table('permissions')->where('id', $id)->delete();
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
