<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drafting_memo_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('drafting_memos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('client_name', 255);
            $table->longText('description')->nullable();
            $table->string('reference_url', 2048)->nullable();
            $table->date('memo_date');
            $table->string('attachment_disk', 32)->nullable();
            $table->string('attachment_path', 2048)->nullable();
            $table->string('attachment_name', 255)->nullable();
            $table->timestamps();

            $table->index('client_name');
            $table->index('memo_date');
        });

        Schema::create('drafting_memo_tag', function (Blueprint $table) {
            $table->foreignId('drafting_memo_id')
                ->constrained('drafting_memos')
                ->cascadeOnDelete();
            $table->foreignId('drafting_memo_tag_id')
                ->constrained('drafting_memo_tags')
                ->cascadeOnDelete();

            $table->primary(['drafting_memo_id', 'drafting_memo_tag_id']);
        });

        $this->seedPermissions();
    }

    public function down(): void
    {
        Schema::dropIfExists('drafting_memo_tag');
        Schema::dropIfExists('drafting_memos');
        Schema::dropIfExists('drafting_memo_tags');

        if (Schema::hasTable('permissions')) {
            DB::table('permissions')
                ->whereIn('slug', ['drafting-memos.view', 'drafting-memos.manage'])
                ->delete();
        }
    }

    private function seedPermissions(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();
        $permissions = [
            [
                'slug' => 'drafting-memos.view',
                'name' => 'Drafting memos',
                'group_key' => 'archi-project',
                'parent_slug' => null,
                'sort_order' => 96,
            ],
            [
                'slug' => 'drafting-memos.manage',
                'name' => 'Manage drafting memos',
                'group_key' => 'archi-project',
                'parent_slug' => 'drafting-memos.view',
                'sort_order' => 97,
            ],
        ];

        foreach ($permissions as $row) {
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

            foreach (['admin', 'user', 'project-manager'] as $roleSlug) {
                if (! DB::table('roles')->where('slug', $roleSlug)->exists()) {
                    continue;
                }

                $exists = DB::table('permission_role')
                    ->where('role', $roleSlug)
                    ->where('permission_id', $permissionId)
                    ->exists();

                if (! $exists) {
                    DB::table('permission_role')->insert([
                        'role' => $roleSlug,
                        'permission_id' => $permissionId,
                    ]);
                }
            }
        }
    }
};
