<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drafting_request_account_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drafting_request_id')
                ->constrained('drafting_requests')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('kind', 16);
            $table->string('number', 64);
            $table->string('category', 64);
            $table->string('rate', 64)->nullable();
            $table->string('status', 64);
            $table->timestamps();

            $table->index(['drafting_request_id', 'kind']);
        });

        $this->seedAccountsAddPermission();
    }

    public function down(): void
    {
        $slug = 'job.drafting.accounts.add';

        if (Schema::hasTable('permission_role')) {
            $permissionId = DB::table('permissions')->where('slug', $slug)->value('id');
            if ($permissionId) {
                DB::table('permission_role')->where('permission_id', $permissionId)->delete();
            }
        }

        DB::table('permissions')->where('slug', $slug)->delete();
        Schema::dropIfExists('drafting_request_account_entries');
    }

    private function seedAccountsAddPermission(): void
    {
        $slug = 'job.drafting.accounts.add';
        $now = now();

        $existing = DB::table('permissions')->where('slug', $slug)->first();

        if ($existing) {
            $permissionId = $existing->id;
            DB::table('permissions')->where('slug', $slug)->update([
                'name' => 'Add quote / invoice',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => 31,
                'updated_at' => $now,
            ]);
        } else {
            $permissionId = DB::table('permissions')->insertGetId([
                'slug' => $slug,
                'name' => 'Add quote / invoice',
                'status' => 'active',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => 31,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $exists = DB::table('permission_role')
            ->where('role', 'admin')
            ->where('permission_id', $permissionId)
            ->exists();

        if (! $exists) {
            DB::table('permission_role')->insert([
                'role' => 'admin',
                'permission_id' => $permissionId,
            ]);
        }
    }
};
