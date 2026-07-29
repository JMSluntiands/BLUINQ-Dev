<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('drafting_requests')) {
            return;
        }

        if (! Schema::hasColumn('drafting_requests', 'vo_hours')) {
            Schema::table('drafting_requests', function (Blueprint $table) {
                $table->decimal('vo_hours', 8, 2)->nullable()->after('is_priority');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('drafting_requests')) {
            return;
        }

        if (Schema::hasColumn('drafting_requests', 'vo_hours')) {
            Schema::table('drafting_requests', function (Blueprint $table) {
                $table->dropColumn('vo_hours');
            });
        }
    }
};
