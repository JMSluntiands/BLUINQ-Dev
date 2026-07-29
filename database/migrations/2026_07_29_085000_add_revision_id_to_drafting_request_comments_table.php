<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_request_comments', function (Blueprint $table) {
            $table->foreignId('drafting_request_revision_id')
                ->nullable()
                ->after('drafting_request_id')
                ->constrained('drafting_request_revisions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('drafting_request_comments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('drafting_request_revision_id');
        });
    }
};
