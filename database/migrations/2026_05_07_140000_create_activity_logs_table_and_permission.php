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
        if (! Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('method', 16);
                $table->string('route_name')->nullable();
                $table->string('path', 2048);
                $table->unsignedSmallInteger('status_code');
                $table->timestamps();

                $table->index('created_at');
            });
        }

        if (! Schema::hasTable('permissions') || ! Schema::hasTable('permission_role')) {
            return;
        }

        $slug = 'settings.activity-logs.view';

        $permission = DB::table('permissions')
            ->where('slug', $slug)
            ->first();

        $now = now();

        if ($permission === null) {
            $id = DB::table('permissions')->insertGetId([
                'slug' => $slug,
                'name' => 'Settings — Activity logs',
                'status' => 'active',
                'sort_order' => 40,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $id = $permission->id;
            DB::table('permissions')
                ->where('id', $id)
                ->update([
                    'name' => 'Settings — Activity logs',
                    'status' => 'active',
                    'sort_order' => 40,
                    'updated_at' => $now,
                ]);
        }

        $alreadyLinked = DB::table('permission_role')
            ->where('role', UserRole::Admin->value)
            ->where('permission_id', $id)
            ->exists();

        if (! $alreadyLinked) {
            DB::table('permission_role')->insert([
                'role' => UserRole::Admin->value,
                'permission_id' => $id,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');

        if (! Schema::hasTable('permissions')) {
            return;
        }

        $id = DB::table('permissions')->where('slug', 'settings.activity-logs.view')->value('id');
        if ($id) {
            if (Schema::hasTable('permission_role')) {
                DB::table('permission_role')->where('permission_id', $id)->delete();
            }
            DB::table('permissions')->where('id', $id)->delete();
        }
    }
};
