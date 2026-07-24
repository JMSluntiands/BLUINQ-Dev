<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('drafting_requests', 'eta')) {
                $table->date('eta')->nullable()->after('start_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (Schema::hasColumn('drafting_requests', 'eta')) {
                $table->dropColumn('eta');
            }
        });
    }
};
