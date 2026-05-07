<?php

/**
 * Safety net if building_types exists without archived_at (e.g. migration 160000
 * not run on this database). Safe to run multiple times.
 */
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('building_types')) {
            return;
        }

        if (Schema::hasColumn('building_types', 'archived_at')) {
            return;
        }

        Schema::table('building_types', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('building_types') || ! Schema::hasColumn('building_types', 'archived_at')) {
            return;
        }

        Schema::table('building_types', function (Blueprint $table) {
            $table->dropColumn('archived_at');
        });
    }
};
