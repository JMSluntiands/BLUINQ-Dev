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
            $table->foreignId('manager_user_id')
                ->nullable()
                ->after('user_id')
                ->constrained('users')
                ->nullOnDelete();
        });

        DB::table('drafting_requests')
            ->whereNull('manager_user_id')
            ->update([
                'manager_user_id' => DB::raw('user_id'),
            ]);
    }

    public function down(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('manager_user_id');
        });
    }
};
