<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_quote_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crm_quote_id')
                ->constrained('crm_quotes')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('action', 64);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['crm_quote_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_quote_activities');
    }
};
