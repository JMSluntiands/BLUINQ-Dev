<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug', 32)->unique();
                $table->boolean('is_system')->default(false);
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->timestamps();
            });

            $now = now();
            DB::table('roles')->insert([
                [
                    'name' => 'Administrator',
                    'slug' => 'admin',
                    'is_system' => true,
                    'sort_order' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'name' => 'Member',
                    'slug' => 'user',
                    'is_system' => true,
                    'sort_order' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        }

        $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');
        $memberRoleId = DB::table('roles')->where('slug', 'user')->value('id');

        if ($adminRoleId === null || $memberRoleId === null || ! Schema::hasTable('users')) {
            return;
        }

        if (! Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id')->nullable()->after('email');
            });

            DB::table('users')->where('role', 'admin')->update(['role_id' => $adminRoleId]);

            DB::table('users')->where(function ($q) {
                $q->where('role', 'user')
                    ->orWhereNull('role');
            })->update(['role_id' => $memberRoleId]);

            DB::table('users')->whereNull('role_id')->update(['role_id' => $memberRoleId]);

            if (Schema::hasColumn('users', 'role')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropColumn('role');
                });
            }

            Schema::table('users', function (Blueprint $table) {
                $table->foreign('role_id')->references('id')->on('roles')->cascadeOnUpdate();
            });
        }

        $now = now();
        if (Schema::hasTable('permissions') && Schema::hasTable('permission_role')) {
            $slug = 'settings.roles.manage';
            $permission = DB::table('permissions')->where('slug', $slug)->first();

            if ($permission === null) {
                $permId = DB::table('permissions')->insertGetId([
                    'slug' => $slug,
                    'name' => 'Settings — Roles',
                    'status' => 'active',
                    'sort_order' => 38,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            } else {
                $permId = $permission->id;
                DB::table('permissions')->where('id', $permId)->update([
                    'name' => 'Settings — Roles',
                    'status' => 'active',
                    'sort_order' => 38,
                    'updated_at' => $now,
                ]);
            }

            $exists = DB::table('permission_role')
                ->where('role', 'admin')
                ->where('permission_id', $permId)
                ->exists();

            if (! $exists) {
                DB::table('permission_role')->insert([
                    'role' => 'admin',
                    'permission_id' => $permId,
                ]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('permissions')) {
            $permId = DB::table('permissions')->where('slug', 'settings.roles.manage')->value('id');
            if ($permId && Schema::hasTable('permission_role')) {
                DB::table('permission_role')->where('permission_id', $permId)->delete();
            }
            DB::table('permissions')->where('slug', 'settings.roles.manage')->delete();
        }

        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'role_id')) {
            Schema::dropIfExists('roles');

            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 32)->default('user')->after('email');
        });

        $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');

        if ($adminRoleId !== null) {
            DB::table('users')
                ->where('role_id', $adminRoleId)
                ->update(['role' => 'admin']);
        }

        DB::table('users')
            ->where('role', '!=', 'admin')
            ->update(['role' => 'user']);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role_id');
        });

        Schema::dropIfExists('roles');
    }
};
