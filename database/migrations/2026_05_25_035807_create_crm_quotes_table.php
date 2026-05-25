<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('allocated');
            $table->timestamp('requested_at')->nullable();
            $table->string('client_company_name');
            $table->string('project_job_number')->nullable();
            $table->text('site_address');
            $table->string('site_owner_name')->nullable();
            $table->foreignId('arrival_input_file_id')->nullable()->constrained('arrival_input_files')->nullOnDelete();
            $table->foreignId('crm_category_id')->nullable()->constrained('crm_categories')->nullOnDelete();
            $table->foreignId('level_of_difficulty_id')->nullable()->constrained('level_of_difficulties')->nullOnDelete();
            $table->foreignId('building_type_id')->nullable()->constrained('building_types')->nullOnDelete();
            $table->foreignId('scope_of_work_id')->nullable()->constrained('scope_of_works')->nullOnDelete();
            $table->foreignId('deliverable_id')->nullable()->constrained('deliverables')->nullOnDelete();
            $table->text('building_area_size')->nullable();
            $table->string('estimated_time_allocation')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('archived_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_quotes');
    }
};
