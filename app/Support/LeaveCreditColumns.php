<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Hostinger Git deploys do not run migrations, so the two-decimal leave
 * columns are applied here once per deploy.
 */
class LeaveCreditColumns
{
    private const CACHE_KEY = 'leave-credit-columns-two-decimals';

    /** @var list<string> */
    private const COLUMNS = [
        'leave_credits',
        'al_credits',
        'al_carried_over',
        'sl_credits',
        'medical_days_used',
    ];

    public static function ensureTwoDecimals(): void
    {
        try {
            if (DB::getDriverName() !== 'mysql' || Cache::get(self::CACHE_KEY) === true) {
                return;
            }

            $scales = collect(DB::select(
                'SELECT COLUMN_NAME AS name, NUMERIC_SCALE AS scale FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME IN ('.implode(',', array_fill(0, count(self::COLUMNS), '?')).')',
                ['users', ...self::COLUMNS],
            ))->pluck('scale', 'name');

            foreach (self::COLUMNS as $column) {
                if (! $scales->has($column) || (int) $scales[$column] >= 2) {
                    continue;
                }

                DB::statement("ALTER TABLE users MODIFY {$column} DECIMAL(6,2) NOT NULL DEFAULT 0");
            }

            Cache::forever(self::CACHE_KEY, true);
        } catch (Throwable $e) {
            Log::warning('Could not widen leave credit columns to two decimals.', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
