<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->foreignId('drafter_user_id')
                ->nullable()
                ->after('category')
                ->constrained('users')
                ->nullOnDelete();
        });

        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->string('drafter_initials', 8)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('drafter_user_id');
        });
    }
};
