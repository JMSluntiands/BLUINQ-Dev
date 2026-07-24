<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $legacySlug = 'leave.credits.manage';

    private string $viewSlug = 'leave.credits.view';

    private string $editSlug = 'leave.credits.edit';

    public function up(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();

        $viewId = $this->upsertPermission([
            'slug' => $this->viewSlug,
            'name' => 'View leave credits',
            'group_key' => 'general',
            'parent_slug' => 'leave.view',
            'sort_order' => 21,
        ], $now);

        $editId = $this->upsertPermission([
            'slug' => $this->editSlug,
            'name' => 'Edit leave credits',
            'group_key' => 'general',
            'parent_slug' => $this->viewSlug,
            'sort_order' => 22,
        ], $now);

        $this->attachToRole('admin', $viewId);
        $this->attachToRole('admin', $editId);

        $legacyId = DB::table('permissions')->where('slug', $this->legacySlug)->value('id');

        if ($legacyId !== null && Schema::hasTable('permission_role')) {
            $roles = DB::table('permission_role')
                ->where('permission_id', $legacyId)
                ->pluck('role')
                ->unique()
                ->all();

            foreach ($roles as $role) {
                $this->attachToRole((string) $role, $viewId);
                $this->attachToRole((string) $role, $editId);
            }

            DB::table('permission_role')->where('permission_id', $legacyId)->delete();
            DB::table('permissions')->where('id', $legacyId)->delete();
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();

        $manageId = $this->upsertPermission([
            'slug' => $this->legacySlug,
            'name' => 'Manage leave credits',
            'group_key' => 'general',
            'parent_slug' => 'leave.view',
            'sort_order' => 21,
        ], $now);

        $editId = DB::table('permissions')->where('slug', $this->editSlug)->value('id');

        if ($editId !== null && Schema::hasTable('permission_role')) {
            $roles = DB::table('permission_role')
                ->where('permission_id', $editId)
                ->pluck('role')
                ->unique()
                ->all();

            foreach ($roles as $role) {
                $this->attachToRole((string) $role, $manageId);
            }
        }

        $this->attachToRole('admin', $manageId);

        foreach ([$this->viewSlug, $this->editSlug] as $slug) {
            $id = DB::table('permissions')->where('slug', $slug)->value('id');
            if ($id === null) {
                continue;
            }
            if (Schema::hasTable('permission_role')) {
                DB::table('permission_role')->where('permission_id', $id)->delete();
            }
            DB::table('permissions')->where('id', $id)->delete();
        }
    }

    /**
     * @param  array{slug: string, name: string, group_key: string, parent_slug: string, sort_order: int}  $row
     */
    private function upsertPermission(array $row, mixed $now): int
    {
        $existing = DB::table('permissions')->where('slug', $row['slug'])->first();

        $payload = [
            'name' => $row['name'],
            'group_key' => $row['group_key'],
            'parent_slug' => $row['parent_slug'],
            'sort_order' => $row['sort_order'],
            'status' => 'active',
            'updated_at' => $now,
        ];

        if ($existing) {
            DB::table('permissions')->where('id', $existing->id)->update($payload);

            return (int) $existing->id;
        }

        return (int) DB::table('permissions')->insertGetId(array_merge($payload, [
            'slug' => $row['slug'],
            'created_at' => $now,
        ]));
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
