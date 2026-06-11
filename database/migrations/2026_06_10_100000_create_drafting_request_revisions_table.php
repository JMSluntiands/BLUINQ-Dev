<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drafting_request_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drafting_request_id')
                ->constrained('drafting_requests')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('code', 64);
            $table->date('log_date');
            $table->string('category', 64);
            $table->string('drafter_initials', 8);
            $table->decimal('hours', 8, 2)->nullable();
            $table->date('submitted_date')->nullable();
            $table->timestamps();

            $table->index(['drafting_request_id', 'log_date']);
        });

        $this->seedRevisionAddPermission();
    }

    public function down(): void
    {
        $slug = 'job.drafting.revision.add';

        if (Schema::hasTable('permission_role')) {
            $permissionId = DB::table('permissions')->where('slug', $slug)->value('id');
            if ($permissionId) {
                DB::table('permission_role')->where('permission_id', $permissionId)->delete();
            }
        }

        DB::table('permissions')->where('slug', $slug)->delete();
        Schema::dropIfExists('drafting_request_revisions');
    }

    private function seedRevisionAddPermission(): void
    {
        $slug = 'job.drafting.revision.add';
        $now = now();

        $existing = DB::table('permissions')->where('slug', $slug)->first();

        if ($existing) {
            $permissionId = $existing->id;
            DB::table('permissions')->where('slug', $slug)->update([
                'name' => 'Add revision',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => 26,
                'updated_at' => $now,
            ]);
        } else {
            $permissionId = DB::table('permissions')->insertGetId([
                'slug' => $slug,
                'name' => 'Add revision',
                'status' => 'active',
                'group_key' => 'archi-project',
                'parent_slug' => 'job.drafting.view',
                'sort_order' => 26,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $adminRole = DB::table('roles')->where('slug', 'admin')->value('slug');
        if ($adminRole) {
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
    }
};
