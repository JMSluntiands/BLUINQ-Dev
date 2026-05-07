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
        if (! Schema::hasTable('arrival_input_files')) {
            Schema::create('arrival_input_files', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('status', 32)->default('active');
                $table->timestamp('archived_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('permissions') || ! Schema::hasTable('permission_role')) {
            return;
        }

        $slug = 'settings.crm.arrival-input-files.view';

        $permission = DB::table('permissions')
            ->where('slug', $slug)
            ->first();

        $now = now();

        if ($permission === null) {
            $id = DB::table('permissions')->insertGetId([
                'slug' => $slug,
                'name' => 'Settings — CRM — Arrival input files',
                'status' => 'active',
                'sort_order' => 38,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $id = $permission->id;
            DB::table('permissions')
                ->where('id', $id)
                ->update([
                    'name' => 'Settings — CRM — Arrival input files',
                    'status' => 'active',
                    'sort_order' => 38,
                    'updated_at' => $now,
                ]);
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
        Schema::dropIfExists('arrival_input_files');

        if (! Schema::hasTable('permissions')) {
            return;
        }

        $id = DB::table('permissions')
            ->where('slug', 'settings.crm.arrival-input-files.view')
            ->value('id');
        if ($id) {
            if (Schema::hasTable('permission_role')) {
                DB::table('permission_role')->where('permission_id', $id)->delete();
            }
            DB::table('permissions')->where('id', $id)->delete();
        }
    }
};
