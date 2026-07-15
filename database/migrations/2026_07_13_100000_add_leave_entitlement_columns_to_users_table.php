<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'employment_status')) {
                $table->string('employment_status', 32)
                    ->default('regular')
                    ->after('date_hired');
            }
            if (! Schema::hasColumn('users', 'al_credits')) {
                $table->integer('al_credits')->default(0)->after('leave_credits');
            }
            if (! Schema::hasColumn('users', 'al_carried_over')) {
                $table->integer('al_carried_over')->default(0)->after('al_credits');
            }
            if (! Schema::hasColumn('users', 'al_carry_expires_on')) {
                $table->date('al_carry_expires_on')->nullable()->after('al_carried_over');
            }
            if (! Schema::hasColumn('users', 'sl_credits')) {
                $table->integer('sl_credits')->default(0)->after('al_carry_expires_on');
            }
            if (! Schema::hasColumn('users', 'medical_days_used')) {
                $table->integer('medical_days_used')->default(0)->after('sl_credits');
            }
            if (! Schema::hasColumn('users', 'leave_balance_year')) {
                $table->unsignedSmallInteger('leave_balance_year')->nullable()->after('medical_days_used');
            }
            if (! Schema::hasColumn('users', 'al_last_accrual_month')) {
                $table->string('al_last_accrual_month', 7)->nullable()->after('leave_balance_year');
            }
        });

        $year = (int) now()->year;
        $slDays = (int) config('leave.sl.annual_days', 15);

        DB::table('users')->orderBy('id')->chunkById(100, function ($users) use ($year, $slDays): void {
            foreach ($users as $user) {
                $al = (int) ($user->leave_credits ?? 0);

                DB::table('users')->where('id', $user->id)->update([
                    'employment_status' => $user->employment_status ?: 'regular',
                    'al_credits' => $al,
                    'al_carried_over' => 0,
                    'al_carry_expires_on' => null,
                    'sl_credits' => $slDays,
                    'medical_days_used' => 0,
                    'leave_balance_year' => $year,
                    'al_last_accrual_month' => now()->format('Y-m'),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach ([
                'employment_status',
                'al_credits',
                'al_carried_over',
                'al_carry_expires_on',
                'sl_credits',
                'medical_days_used',
                'leave_balance_year',
                'al_last_accrual_month',
            ] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
