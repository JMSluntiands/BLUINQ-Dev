<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            if (! Schema::hasColumn('permissions', 'group_key')) {
                $table->string('group_key', 64)->nullable()->after('status');
            }
            if (! Schema::hasColumn('permissions', 'parent_slug')) {
                $table->string('parent_slug')->nullable()->after('group_key');
            }
        });

        $this->assignGroupsToExistingPermissions();
        $this->seedJobDraftingPermissions();
    }

    public function down(): void
    {
        $slugs = [
            'job.drafting.view',
            'job.drafting.job-details.edit',
            'job.drafting.building-area.edit',
            'job.drafting.archive',
            'job.drafting.revision.view',
            'job.drafting.accounts.view',
            'job.drafting.files.view',
            'job.drafting.files.edit',
            'job.drafting.comments.view',
            'job.drafting.comments.post',
            'job.drafting.activity.view',
        ];

        if (Schema::hasTable('permission_role')) {
            $ids = DB::table('permissions')->whereIn('slug', $slugs)->pluck('id');
            if ($ids->isNotEmpty()) {
                DB::table('permission_role')->whereIn('permission_id', $ids)->delete();
            }
        }

        DB::table('permissions')->whereIn('slug', $slugs)->delete();

        Schema::table('permissions', function (Blueprint $table) {
            if (Schema::hasColumn('permissions', 'parent_slug')) {
                $table->dropColumn('parent_slug');
            }
            if (Schema::hasColumn('permissions', 'group_key')) {
                $table->dropColumn('group_key');
            }
        });
    }

    private function assignGroupsToExistingPermissions(): void
    {
        $general = ['dashboard.view', 'profile.view'];

        $workflow = [
            'settings.building-type.view',
            'settings.service-engaging.view',
            'settings.external-wall-construction.view',
            'settings.roof-type.view',
            'settings.scope-of-work.view',
            'settings.deliverables.view',
            'settings.level-of-difficulty.view',
            'settings.crm.arrival-input-files.view',
            'settings.crm.categories.view',
        ];

        $system = [
            'settings.permissions.manage',
            'settings.user-accounts.manage',
            'settings.roles.manage',
            'settings.activity-logs.view',
        ];

        foreach ($general as $slug) {
            DB::table('permissions')->where('slug', $slug)->update([
                'group_key' => 'general',
                'parent_slug' => null,
            ]);
        }

        foreach ($workflow as $slug) {
            DB::table('permissions')->where('slug', $slug)->update([
                'group_key' => 'workflow-settings',
                'parent_slug' => null,
            ]);
        }

        foreach ($system as $slug) {
            DB::table('permissions')->where('slug', $slug)->update([
                'group_key' => 'system',
                'parent_slug' => null,
            ]);
        }

        DB::table('permissions')->where('slug', 'dashboard.view')->update([
            'name' => 'Archi — Job board',
            'group_key' => 'archi-project',
        ]);
    }

    private function seedJobDraftingPermissions(): void
    {
        $now = now();
        $baseOrder = 100;

        $rows = [
            [
                'slug' => 'job.drafting.view',
                'name' => 'Job detail page',
                'group_key' => 'archi-project',
                'parent_slug' => null,
                'sort_order' => $baseOrder + 5,
            ],
            [
                'slug' => 'job.drafting.job-details.edit',
                'name' => 'Edit job details',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => $baseOrder + 10,
            ],
            [
                'slug' => 'job.drafting.building-area.edit',
                'name' => 'Edit building area',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => $baseOrder + 15,
            ],
            [
                'slug' => 'job.drafting.archive',
                'name' => 'Archive / restore job',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => $baseOrder + 20,
            ],
            [
                'slug' => 'job.drafting.revision.view',
                'name' => 'Revision card',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => $baseOrder + 25,
            ],
            [
                'slug' => 'job.drafting.accounts.view',
                'name' => 'Quotes & invoices card',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => $baseOrder + 30,
            ],
            [
                'slug' => 'job.drafting.files.view',
                'name' => 'Files section',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => $baseOrder + 35,
            ],
            [
                'slug' => 'job.drafting.files.edit',
                'name' => 'Edit files',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => $baseOrder + 40,
            ],
            [
                'slug' => 'job.drafting.comments.view',
                'name' => 'Comments section',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => $baseOrder + 45,
            ],
            [
                'slug' => 'job.drafting.comments.post',
                'name' => 'Post comments',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => $baseOrder + 50,
            ],
            [
                'slug' => 'job.drafting.activity.view',
                'name' => 'Activity log',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => $baseOrder + 55,
            ],
        ];

        $memberDefaults = [
            'job.drafting.view',
            'job.drafting.building-area.edit',
            'job.drafting.files.view',
            'job.drafting.comments.view',
            'job.drafting.comments.post',
            'job.drafting.activity.view',
        ];

        foreach ($rows as $row) {
            $existing = DB::table('permissions')->where('slug', $row['slug'])->first();

            if ($existing) {
                DB::table('permissions')->where('slug', $row['slug'])->update([
                    'name' => $row['name'],
                    'group_key' => $row['group_key'],
                    'parent_slug' => $row['parent_slug'],
                    'sort_order' => $row['sort_order'],
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

            if (in_array($row['slug'], $memberDefaults, true)) {
                $this->attachToRole('user', $permissionId);
            }
        }
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
