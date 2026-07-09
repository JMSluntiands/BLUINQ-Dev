<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timesheet_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('week_start');
            $table->string('task_type', 32);
            $table->foreignId('drafting_request_revision_id')
                ->nullable()
                ->constrained('drafting_request_revisions')
                ->nullOnDelete();
            $table->string('approval_status', 16)->default('pending');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(
                ['user_id', 'week_start', 'drafting_request_revision_id'],
                'timesheet_revision_entry_unique',
            );
            $table->index(['user_id', 'week_start']);
        });

        Schema::create('timesheet_entry_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timesheet_entry_id')
                ->constrained('timesheet_entries')
                ->cascadeOnDelete();
            $table->date('work_date');
            $table->decimal('hours', 4, 1)->default(0);
            $table->timestamps();

            $table->unique(['timesheet_entry_id', 'work_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timesheet_entry_hours');
        Schema::dropIfExists('timesheet_entries');
    }
};
