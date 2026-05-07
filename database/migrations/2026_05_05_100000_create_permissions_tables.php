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
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('status', 32)->default('active');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('permission_role', function (Blueprint $table) {
            $table->id();
            $table->string('role', 32);
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->unique(['role', 'permission_id']);
        });

        $now = now();

        $rows = [
            ['slug' => 'dashboard.view', 'name' => 'Dashboard', 'sort_order' => 10],
            ['slug' => 'profile.view', 'name' => 'Profile', 'sort_order' => 20],
            ['slug' => 'settings.building-type.view', 'name' => 'Settings — Building type', 'sort_order' => 30],
            ['slug' => 'settings.permissions.manage', 'name' => 'Settings — Role permissions', 'sort_order' => 40],
        ];

        foreach ($rows as $row) {
            DB::table('permissions')->insert([
                'slug' => $row['slug'],
                'name' => $row['name'],
                'status' => 'active',
                'sort_order' => $row['sort_order'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $idsBySlug = DB::table('permissions')->pluck('id', 'slug');

        $adminSlugs = array_keys($idsBySlug->all());
        $userSlugs = ['dashboard.view', 'profile.view'];

        foreach ($adminSlugs as $slug) {
            DB::table('permission_role')->insert([
                'role' => UserRole::Admin->value,
                'permission_id' => $idsBySlug[$slug],
            ]);
        }

        foreach ($userSlugs as $slug) {
            DB::table('permission_role')->insert([
                'role' => UserRole::User->value,
                'permission_id' => $idsBySlug[$slug],
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
    }
};
