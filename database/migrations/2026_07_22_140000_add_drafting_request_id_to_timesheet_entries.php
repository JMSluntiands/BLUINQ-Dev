<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timesheet_entries', function (Blueprint $table) {
            $table->foreignId('drafting_request_id')
                ->nullable()
                ->after('drafting_request_revision_id')
                ->constrained('drafting_requests')
                ->nullOnDelete();

            $table->index(
                ['user_id', 'week_start', 'drafting_request_id', 'task_type'],
                'timesheet_project_activity_index',
            );
        });
    }

    public function down(): void
    {
        Schema::table('timesheet_entries', function (Blueprint $table) {
            $table->dropIndex('timesheet_project_activity_index');
            $table->dropConstrainedForeignId('drafting_request_id');
        });
    }
};
