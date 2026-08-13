<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var list<array{slug: string, name: string, sort_order: int}> */
    private array $permissions = [
        [
            'slug' => 'design.list.view',
            'name' => 'Design Project Management',
            'sort_order' => 200,
        ],
        [
            'slug' => 'design-memos.view',
            'name' => 'Design Memos',
            'sort_order' => 201,
        ],
        [
            'slug' => 'design.catalogue.view',
            'name' => 'Design Catalogue',
            'sort_order' => 202,
        ],
    ];

    public function up(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();

        foreach ($this->permissions as $row) {
            $permissionId = $this->upsertPermission($row, $now);
            $this->attachToRole(UserRole::Admin->value, $permissionId);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $slugs = array_column($this->permissions, 'slug');
        $ids = DB::table('permissions')->whereIn('slug', $slugs)->pluck('id');

        if ($ids->isNotEmpty() && Schema::hasTable('permission_role')) {
            DB::table('permission_role')->whereIn('permission_id', $ids)->delete();
        }

        DB::table('permissions')->whereIn('slug', $slugs)->delete();
    }

    /**
     * @param  array{slug: string, name: string, sort_order: int}  $row
     */
    private function upsertPermission(array $row, $now): int
    {
        $payload = [
            'name' => $row['name'],
            'status' => 'active',
            'sort_order' => $row['sort_order'],
            'updated_at' => $now,
        ];

        if (Schema::hasColumn('permissions', 'group_key')) {
            $payload['group_key'] = 'design-project';
            $payload['parent_slug'] = null;
        }

        $existing = DB::table('permissions')->where('slug', $row['slug'])->first();

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

        if (! DB::table('roles')->where('slug', $role)->exists()) {
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
