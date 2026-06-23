<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        if (! Schema::hasColumn('users', 'leave_credits')) {
            Schema::table('users', function (Blueprint $table) {
                $table->integer('leave_credits')->default(0)->after('achievements_milestones');
            });
        }

        $defaultCredits = (int) config('leave.default_credits', 15);

        DB::table('users')
            ->whereNull('archived_at')
            ->where('leave_credits', 0)
            ->update(['leave_credits' => $defaultCredits]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'leave_credits')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('leave_credits');
            });
        }
    }
};
