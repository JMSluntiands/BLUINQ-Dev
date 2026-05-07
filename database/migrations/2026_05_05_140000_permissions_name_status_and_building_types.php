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
        if (! Schema::hasTable('permissions')) {
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

            $this->seedPermissionsAndRoles();
        } else {
            if (! Schema::hasColumn('permissions', 'name')) {
                Schema::table('permissions', function (Blueprint $table) {
                    $table->string('name')->nullable()->after('slug');
                    $table->string('status', 32)->default('active')->after('name');
                });

                foreach (DB::table('permissions')->get() as $row) {
                    $name = property_exists($row, 'label') && $row->label !== null && $row->label !== ''
                        ? $row->label
                        : $row->slug;
                    DB::table('permissions')->where('id', $row->id)->update([
                        'name' => $name,
                        'status' => 'active',
                    ]);
                }

                if (Schema::hasColumn('permissions', 'label')) {
                    Schema::table('permissions', function (Blueprint $table) {
                        $table->dropColumn('label');
                    });
                }
            } elseif (! Schema::hasColumn('permissions', 'status')) {
                Schema::table('permissions', function (Blueprint $table) {
                    $table->string('status', 32)->default('active')->after('name');
                });
            }
        }

        if (! Schema::hasTable('building_types')) {
            Schema::create('building_types', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('status', 32)->default('active');
                $table->timestamp('archived_at')->nullable();
                $table->timestamps();
            });

            $now = now();
            DB::table('building_types')->insert([
                [
                    'name' => 'Residential',
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'name' => 'Commercial',
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('building_types');
    }

    private function seedPermissionsAndRoles(): void
    {
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

        foreach (array_keys($idsBySlug->all()) as $slug) {
            DB::table('permission_role')->insert([
                'role' => UserRole::Admin->value,
                'permission_id' => $idsBySlug[$slug],
            ]);
        }

        foreach (['dashboard.view', 'profile.view'] as $slug) {
            DB::table('permission_role')->insert([
                'role' => UserRole::User->value,
                'permission_id' => $idsBySlug[$slug],
            ]);
        }
    }
};
