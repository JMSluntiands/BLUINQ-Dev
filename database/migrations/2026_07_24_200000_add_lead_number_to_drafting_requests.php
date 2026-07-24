<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('drafting_requests')) {
            return;
        }

        if (! Schema::hasColumn('drafting_requests', 'lead_number')) {
            Schema::table('drafting_requests', function (Blueprint $table) {
                $table->string('lead_number', 32)->nullable()->after('id');
            });
        }

        $timezone = config('app.timezone') ?: 'UTC';

        DB::table('drafting_requests')
            ->whereNull('lead_number')
            ->orderBy('id')
            ->select(['id', 'requested_at', 'created_at'])
            ->chunkById(200, function ($rows) use ($timezone) {
                foreach ($rows as $row) {
                    $at = $row->requested_at ?? $row->created_at;
                    $year = $at
                        ? \Carbon\Carbon::parse($at)->timezone($timezone)->format('y')
                        : now($timezone)->format('y');

                    DB::table('drafting_requests')
                        ->where('id', $row->id)
                        ->update([
                            'lead_number' => sprintf('%s%03d', $year, $row->id),
                        ]);
                }
            });

        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->unique('lead_number');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('drafting_requests')
            || ! Schema::hasColumn('drafting_requests', 'lead_number')) {
            return;
        }

        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->dropUnique(['lead_number']);
            $table->dropColumn('lead_number');
        });
    }
};
