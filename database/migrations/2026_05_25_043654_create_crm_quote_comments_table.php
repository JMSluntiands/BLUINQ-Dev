<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_quote_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crm_quote_id')
                ->constrained('crm_quotes')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('kind', 16)->default('comment');
            $table->longText('body');
            $table->timestamps();

            $table->index(['crm_quote_id', 'kind', 'created_at'], 'crm_qc_kind_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_quote_comments');
    }
};
