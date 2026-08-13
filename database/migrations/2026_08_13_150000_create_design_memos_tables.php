<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('design_memo_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('design_memos', function (Blueprint $table) {
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

        Schema::create('design_memo_tag', function (Blueprint $table) {
            $table->foreignId('design_memo_id')
                ->constrained('design_memos')
                ->cascadeOnDelete();
            $table->foreignId('design_memo_tag_id')
                ->constrained('design_memo_tags')
                ->cascadeOnDelete();

            $table->primary(['design_memo_id', 'design_memo_tag_id']);
        });

        $this->seedManagePermission();
    }

    public function down(): void
    {
        Schema::dropIfExists('design_memo_tag');
        Schema::dropIfExists('design_memos');
        Schema::dropIfExists('design_memo_tags');

        if (Schema::hasTable('permissions')) {
            $id = DB::table('permissions')->where('slug', 'design-memos.manage')->value('id');

            if ($id && Schema::hasTable('permission_role')) {
                DB::table('permission_role')->where('permission_id', $id)->delete();
            }

            DB::table('permissions')->where('slug', 'design-memos.manage')->delete();
        }
    }

    private function seedManagePermission(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();
        $slug = 'design-memos.manage';
        $payload = [
            'name' => 'Manage design memos',
            'status' => 'active',
            'sort_order' => 203,
            'updated_at' => $now,
        ];

        if (Schema::hasColumn('permissions', 'group_key')) {
            $payload['group_key'] = 'design-project';
            $payload['parent_slug'] = 'design-memos.view';
        }

        $existing = DB::table('permissions')->where('slug', $slug)->first();

        if ($existing) {
            DB::table('permissions')->where('id', $existing->id)->update($payload);
            $permissionId = (int) $existing->id;
        } else {
            $permissionId = (int) DB::table('permissions')->insertGetId(array_merge($payload, [
                'slug' => $slug,
                'created_at' => $now,
            ]));
        }

        if (! Schema::hasTable('permission_role')) {
            return;
        }

        $roles = [UserRole::Admin->value, 'project-manager'];
        $viewPermissionId = DB::table('permissions')->where('slug', 'design-memos.view')->value('id');

        if ($viewPermissionId) {
            $roles = array_values(array_unique(array_merge(
                $roles,
                DB::table('permission_role')
                    ->where('permission_id', $viewPermissionId)
                    ->pluck('role')
                    ->all(),
            )));
        }

        foreach ($roles as $roleSlug) {
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
};
