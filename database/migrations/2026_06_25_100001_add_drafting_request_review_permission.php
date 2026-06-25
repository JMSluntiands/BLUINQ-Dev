<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @var list<string>
     */
    private array $newSlugs = [
        'job.drafting-request.review',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();

        $rows = [
            [
                'slug' => 'job.drafting-request.review',
                'name' => 'Review public drafting requests',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting-request.view',
                'sort_order' => 96,
            ],
        ];

        foreach ($rows as $row) {
            $existing = DB::table('permissions')->where('slug', $row['slug'])->first();

            if ($existing) {
                DB::table('permissions')->where('slug', $row['slug'])->update([
                    'name' => $row['name'],
                    'group_key' => $row['group_key'],
                    'parent_slug' => $row['parent_slug'],
                    'sort_order' => $row['sort_order'],
                    'status' => 'active',
                    'updated_at' => $now,
                ]);
                $permissionId = $existing->id;
            } else {
                $permissionId = DB::table('permissions')->insertGetId([
                    'slug' => $row['slug'],
                    'name' => $row['name'],
                    'status' => 'active',
                    'group_key' => $row['group_key'],
                    'parent_slug' => $row['parent_slug'],
                    'sort_order' => $row['sort_order'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $this->attachToRole('admin', $permissionId);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $ids = DB::table('permissions')->whereIn('slug', $this->newSlugs)->pluck('id');

        if ($ids->isNotEmpty() && Schema::hasTable('permission_role')) {
            DB::table('permission_role')->whereIn('permission_id', $ids)->delete();
        }

        DB::table('permissions')->whereIn('slug', $this->newSlugs)->delete();
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
