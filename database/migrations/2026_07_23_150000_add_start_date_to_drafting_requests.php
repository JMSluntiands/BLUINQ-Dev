<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('drafting_requests', 'start_date')) {
                $table->date('start_date')->nullable()->after('requested_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (Schema::hasColumn('drafting_requests', 'start_date')) {
                $table->dropColumn('start_date');
            }
        });
    }
};
