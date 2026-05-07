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
        if (! Schema::hasTable('deliverables')) {
            Schema::create('deliverables', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('status', 32)->default('active');
                $table->timestamp('archived_at')->nullable();
                $table->timestamps();
            });

            $now = now();
            DB::table('deliverables')->insert([
                [
                    'name' => 'Drawings set',
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'name' => 'Specifications',
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        }

        if (! Schema::hasTable('permissions') || ! Schema::hasTable('permission_role')) {
            return;
        }

        $slug = 'settings.deliverables.view';

        $permission = DB::table('permissions')
            ->where('slug', $slug)
            ->first();

        if ($permission === null) {
            $now = now();
            $id = DB::table('permissions')->insertGetId([
                'slug' => $slug,
                'name' => 'Settings — Deliverables',
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
                    'name' => 'Settings — Deliverables',
                    'status' => 'active',
                    'sort_order' => 40,
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
        Schema::dropIfExists('deliverables');
    }
};
