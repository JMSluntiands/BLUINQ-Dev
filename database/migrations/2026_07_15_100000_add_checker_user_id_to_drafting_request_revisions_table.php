<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->foreignId('checker_user_id')
                ->nullable()
                ->after('drafter_initials')
                ->constrained('users')
                ->nullOnDelete();
            $table->string('checker_initials', 8)
                ->nullable()
                ->after('checker_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('checker_user_id');
            $table->dropColumn('checker_initials');
        });
    }
};
