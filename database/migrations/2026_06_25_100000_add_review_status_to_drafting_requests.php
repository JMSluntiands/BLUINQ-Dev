<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->string('review_status', 32)->default('accepted')->after('status');
            $table->foreignId('reviewed_by')->nullable()->after('review_status')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });

        DB::table('drafting_requests')->update(['review_status' => 'accepted']);

        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['review_status', 'reviewed_at']);
        });
    }
};
