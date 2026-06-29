<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->decimal('drafting_hours', 8, 2)->nullable()->after('drafter_initials');
            $table->decimal('checking_hours', 8, 2)->nullable()->after('drafting_hours');
        });

        DB::table('drafting_request_revisions')
            ->whereNotNull('hours')
            ->update(['drafting_hours' => DB::raw('hours')]);

        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->dropColumn('hours');
        });
    }

    public function down(): void
    {
        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->decimal('hours', 8, 2)->nullable()->after('drafter_initials');
        });

        DB::table('drafting_request_revisions')
            ->whereNotNull('drafting_hours')
            ->update(['hours' => DB::raw('drafting_hours')]);

        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->dropColumn(['drafting_hours', 'checking_hours']);
        });
    }
};
