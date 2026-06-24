<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drafting_request_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drafting_request_id')
                ->constrained('drafting_requests')
                ->cascadeOnDelete();
            $table->string('role', 16);
            $table->unsignedTinyInteger('slot');
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->decimal('hours', 8, 2)->nullable();
            $table->timestamps();

            $table->unique(
                ['drafting_request_id', 'role', 'slot'],
                'drf_assignment_slot_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drafting_request_assignments');
    }
};
