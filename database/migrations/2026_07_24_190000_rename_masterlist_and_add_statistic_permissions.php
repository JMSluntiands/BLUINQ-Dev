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

        DB::table('permissions')->where('slug', 'job.drafting-request.view')->update([
            'name' => 'Project Masterlist',
            'updated_at' => $now,
        ]);

        DB::table('permissions')->where('slug', 'job.list.view')->update([
            'name' => 'Archi Project Management',
            'updated_at' => $now,
        ]);

        $statisticId = $this->upsertPermission([
            'slug' => 'job.statistic.view',
            'name' => 'Statistic',
            'group_key' => 'archi-project',
            'parent_slug' => null,
            'sort_order' => 92,
        ], $now);

        $this->attachToRole('admin', $statisticId);

        $listPermissionId = DB::table('permissions')
            ->where('slug', 'job.list.view')
            ->value('id');

        if ($listPermissionId === null || ! Schema::hasTable('permission_role')) {
            return;
        }

        $rolesWithList = DB::table('permission_role')
            ->where('permission_id', $listPermissionId)
            ->pluck('role')
            ->unique()
            ->all();

        foreach ($rolesWithList as $role) {
            $this->attachToRole((string) $role, $statisticId);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();

        DB::table('permissions')->where('slug', 'job.drafting-request.view')->update([
            'name' => 'Draft request form',
            'updated_at' => $now,
        ]);

        DB::table('permissions')->where('slug', 'job.list.view')->update([
            'name' => 'Job list',
            'updated_at' => $now,
        ]);

        $statisticId = DB::table('permissions')
            ->where('slug', 'job.statistic.view')
            ->value('id');

        if ($statisticId !== null && Schema::hasTable('permission_role')) {
            DB::table('permission_role')->where('permission_id', $statisticId)->delete();
        }

        DB::table('permissions')->where('slug', 'job.statistic.view')->delete();
    }

    /**
     * @param  array{slug: string, name: string, group_key: string, parent_slug: string|null, sort_order: int}  $row
     */
    private function upsertPermission(array $row, mixed $now): int
    {
        $existing = DB::table('permissions')->where('slug', $row['slug'])->first();

        $payload = [
            'name' => $row['name'],
            'status' => 'active',
            'group_key' => $row['group_key'],
            'parent_slug' => $row['parent_slug'],
            'sort_order' => $row['sort_order'],
            'updated_at' => $now,
        ];

        if ($existing) {
            DB::table('permissions')->where('id', $existing->id)->update($payload);

            return (int) $existing->id;
        }

        return (int) DB::table('permissions')->insertGetId([
            ...$payload,
            'slug' => $row['slug'],
            'created_at' => $now,
        ]);
    }

    private function attachToRole(string $role, int $permissionId): void
    {
        if (! Schema::hasTable('permission_role')) {
            return;
        }

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
