<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('public_holidays', function (Blueprint $table) {
            $table->id();
            $table->string('region', 32);
            $table->date('holiday_date');
            $table->string('name');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['region', 'holiday_date', 'name']);
            $table->index(['holiday_date', 'region']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_holidays');
    }
};
