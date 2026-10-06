<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('drafting_request_revisions')) {
            return;
        }

        if (! Schema::hasColumn('drafting_request_revisions', 'vo_hours')) {
            Schema::table('drafting_request_revisions', function (Blueprint $table) {
                $table->decimal('vo_hours', 8, 2)->nullable()->after('area_size');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('drafting_request_revisions')) {
            return;
        }

        if (Schema::hasColumn('drafting_request_revisions', 'vo_hours')) {
            Schema::table('drafting_request_revisions', function (Blueprint $table) {
                $table->dropColumn('vo_hours');
            });
        }
    }
};
