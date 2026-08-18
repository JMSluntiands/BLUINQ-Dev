<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->string('start_portion', 32)->default('morning')->after('end_date');
            $table->string('end_portion', 32)->default('afternoon')->after('start_portion');
        });

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE users MODIFY leave_credits DECIMAL(6,1) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY al_credits DECIMAL(6,1) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY al_carried_over DECIMAL(6,1) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY sl_credits DECIMAL(6,1) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY medical_days_used DECIMAL(6,1) NOT NULL DEFAULT 0');
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['start_portion', 'end_portion']);
        });

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE users MODIFY leave_credits INT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY al_credits INT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY al_carried_over INT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY sl_credits INT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY medical_days_used INT NOT NULL DEFAULT 0');
    }
};
