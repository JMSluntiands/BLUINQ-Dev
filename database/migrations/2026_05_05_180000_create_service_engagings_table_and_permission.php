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
        if (! Schema::hasTable('service_engagings')) {
            Schema::create('service_engagings', function (Blueprint $table) {
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

        $slug = 'settings.service-engaging.view';

        $permission = DB::table('permissions')
            ->where('slug', $slug)
            ->first();

        if ($permission === null) {
            $now = now();
            $id = DB::table('permissions')->insertGetId([
                'slug' => $slug,
                'name' => 'Settings — Service engaging',
                'status' => 'active',
                'sort_order' => 35,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $id = $permission->id;
            DB::table('permissions')
                ->where('id', $id)
                ->update([
                    'name' => 'Settings — Service engaging',
                    'status' => 'active',
                    'sort_order' => 35,
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
        Schema::dropIfExists('service_engagings');
    }
};
