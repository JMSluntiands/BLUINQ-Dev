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
            $table->string('workflow_stage', 32)
                ->default('masterlist')
                ->after('review_status');
            $table->index('workflow_stage');
        });

        // Existing accepted board jobs stay on APM; pending/rejected stay on masterlist default.
        DB::table('drafting_requests')
            ->where('review_status', 'accepted')
            ->update(['workflow_stage' => 'apm']);
    }

    public function down(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->dropIndex(['workflow_stage']);
            $table->dropColumn('workflow_stage');
        });
    }
};
