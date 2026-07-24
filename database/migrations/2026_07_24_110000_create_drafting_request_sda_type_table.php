<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('drafting_request_sda_type')) {
            Schema::create('drafting_request_sda_type', function (Blueprint $table) {
                $table->id();
                $table->foreignId('drafting_request_id')
                    ->constrained('drafting_requests')
                    ->cascadeOnDelete();
                $table->foreignId('sda_type_id')
                    ->constrained('sda_types')
                    ->cascadeOnDelete();
                $table->unique(
                    ['drafting_request_id', 'sda_type_id'],
                    'drf_sda_type_unique',
                );
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('drafting_request_sda_type');
    }
};
