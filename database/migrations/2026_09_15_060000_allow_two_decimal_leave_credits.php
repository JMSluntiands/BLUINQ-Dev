<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE users MODIFY leave_credits DECIMAL(6,2) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY al_credits DECIMAL(6,2) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY al_carried_over DECIMAL(6,2) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY sl_credits DECIMAL(6,2) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY medical_days_used DECIMAL(6,2) NOT NULL DEFAULT 0');
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE users MODIFY leave_credits DECIMAL(6,1) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY al_credits DECIMAL(6,1) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY al_carried_over DECIMAL(6,1) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY sl_credits DECIMAL(6,1) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE users MODIFY medical_days_used DECIMAL(6,1) NOT NULL DEFAULT 0');
    }
};
