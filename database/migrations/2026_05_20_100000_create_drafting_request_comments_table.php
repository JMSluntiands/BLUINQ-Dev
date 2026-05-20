<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drafting_request_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drafting_request_id')
                ->constrained('drafting_requests')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->longText('body');
            $table->timestamps();

            $table->index(['drafting_request_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drafting_request_comments');
    }
};
