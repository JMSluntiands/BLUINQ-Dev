<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->unsignedTinyInteger('unit_development_count')->default(0)->after('ndis_sda');
            $table->json('drawing_checklist')->nullable()->after('additional_inclusions');
        });

        Schema::create('drafting_request_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drafting_request_id')->constrained('drafting_requests')->cascadeOnDelete();
            $table->unsignedTinyInteger('unit_number');
            $table->string('house_type')->nullable();
            $table->decimal('area_sqm', 12, 2)->nullable();
            $table->timestamps();

            $table->unique(['drafting_request_id', 'unit_number']);
        });

        $now = now();
        $constructionNames = [
            '2c Brickwork',
            '1c Brickwork',
            'Brick Veneer',
            'Steel Frame',
            'Timber Frame',
            'Bondor',
            'EPS',
        ];

        foreach ($constructionNames as $name) {
            $exists = DB::table('external_wall_constructions')
                ->where('name', $name)
                ->exists();

            if (! $exists) {
                DB::table('external_wall_constructions')->insert([
                    'name' => $name,
                    'status' => 'active',
                    'archived_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        $revisionView = DB::table('permissions')
            ->where('slug', 'job.drafting.revision.view')
            ->first();

        if ($revisionView) {
            $already = DB::table('permission_role')
                ->where('role', 'user')
                ->where('permission_id', $revisionView->id)
                ->exists();

            if (! $already) {
                DB::table('permission_role')->insert([
                    'role' => 'user',
                    'permission_id' => $revisionView->id,
                ]);
            }
        }
    }

    public function down(): void
    {
        $revisionView = DB::table('permissions')
            ->where('slug', 'job.drafting.revision.view')
            ->first();

        if ($revisionView) {
            DB::table('permission_role')
                ->where('role', 'user')
                ->where('permission_id', $revisionView->id)
                ->delete();
        }

        Schema::dropIfExists('drafting_request_units');

        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->dropColumn(['unit_development_count', 'drawing_checklist']);
        });
    }
};
