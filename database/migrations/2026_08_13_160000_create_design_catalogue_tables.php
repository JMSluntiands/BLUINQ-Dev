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
        Schema::create('design_catalogue_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('type', 32);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['name', 'type']);
            $table->index('type');
        });

        Schema::create('design_catalogue_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('client_name', 255)->nullable();
            $table->string('model_name', 255);
            $table->string('rcode', 32);
            $table->string('area', 64)->nullable();
            $table->string('link_url', 2048)->nullable();
            $table->date('catalogue_date');
            $table->string('attachment_disk', 32)->nullable();
            $table->string('attachment_path', 2048)->nullable();
            $table->string('attachment_name', 255)->nullable();
            $table->timestamps();

            $table->index('client_name');
            $table->index('catalogue_date');
            $table->index('rcode');
        });

        Schema::create('design_catalogue_item_tag', function (Blueprint $table) {
            $table->foreignId('design_catalogue_item_id')
                ->constrained('design_catalogue_items')
                ->cascadeOnDelete();
            $table->foreignId('design_catalogue_tag_id')
                ->constrained('design_catalogue_tags')
                ->cascadeOnDelete();

            $table->primary(['design_catalogue_item_id', 'design_catalogue_tag_id'], 'design_catalogue_item_tag_pk');
        });

        $this->seedManagePermission();
    }

    public function down(): void
    {
        Schema::dropIfExists('design_catalogue_item_tag');
        Schema::dropIfExists('design_catalogue_items');
        Schema::dropIfExists('design_catalogue_tags');

        if (! Schema::hasTable('permissions')) {
            return;
        }

        $id = DB::table('permissions')->where('slug', 'design.catalogue.manage')->value('id');

        if ($id && Schema::hasTable('permission_role')) {
            DB::table('permission_role')->where('permission_id', $id)->delete();
        }

        DB::table('permissions')->where('slug', 'design.catalogue.manage')->delete();
    }

    private function seedManagePermission(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();
        $slug = 'design.catalogue.manage';
        $payload = [
            'name' => 'Manage design catalogue',
            'status' => 'active',
            'sort_order' => 204,
            'updated_at' => $now,
        ];

        if (Schema::hasColumn('permissions', 'group_key')) {
            $payload['group_key'] = 'design-project';
            $payload['parent_slug'] = 'design.catalogue.view';
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
        $viewPermissionId = DB::table('permissions')->where('slug', 'design.catalogue.view')->value('id');

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
