<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('milestone_date');
            $table->string('title');
            $table->text('impact_result')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'milestone_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_milestones');
    }
};
