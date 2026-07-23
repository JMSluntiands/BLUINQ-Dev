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
        if (! Schema::hasTable('workflow_statuses')) {
            Schema::create('workflow_statuses', function (Blueprint $table) {
                $table->id();
                $table->string('kind', 32);
                $table->string('code', 64)->nullable();
                $table->string('name');
                $table->string('status', 32)->default('active');
                $table->timestamp('archived_at')->nullable();
                $table->timestamps();

                $table->unique(['kind', 'code']);
            });
        }

        if (! Schema::hasTable('permissions') || ! Schema::hasTable('permission_role')) {
            return;
        }

        $slug = 'settings.workflow-status.view';

        $permission = DB::table('permissions')
            ->where('slug', $slug)
            ->first();

        $now = now();

        $payload = [
            'name' => 'Settings — Status',
            'status' => 'active',
            'sort_order' => 53,
            'updated_at' => $now,
        ];

        if (Schema::hasColumn('permissions', 'group_key')) {
            $payload['group_key'] = 'workflow-settings';
            $payload['parent_slug'] = null;
        }

        if ($permission === null) {
            $id = DB::table('permissions')->insertGetId(array_merge($payload, [
                'slug' => $slug,
                'created_at' => $now,
            ]));
        } else {
            $id = $permission->id;
            DB::table('permissions')->where('id', $id)->update($payload);
        }

        $alreadyLinkedAdmin = DB::table('permission_role')
            ->where('role', UserRole::Admin->value)
            ->where('permission_id', $id)
            ->exists();

        if (! $alreadyLinkedAdmin) {
            DB::table('permission_role')->insert([
                'role' => UserRole::Admin->value,
                'permission_id' => $id,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_statuses');

        if (! Schema::hasTable('permissions')) {
            return;
        }

        $id = DB::table('permissions')
            ->where('slug', 'settings.workflow-status.view')
            ->value('id');
        if ($id) {
            if (Schema::hasTable('permission_role')) {
                DB::table('permission_role')->where('permission_id', $id)->delete();
            }
            DB::table('permissions')->where('id', $id)->delete();
        }
    }
};
