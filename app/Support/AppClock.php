<?php

namespace App\Support;

use Illuminate\Support\Carbon;

class AppClock
{
    public const TIMEZONE = 'Asia/Manila';

    public static function timezone(): string
    {
        return self::TIMEZONE;
    }

    public static function now(): Carbon
    {
        return now(self::TIMEZONE);
    }

    public static function today(): Carbon
    {
        return Carbon::today(self::TIMEZONE);
    }

    /**
     * A datetime typed in the app is Philippine wall time. Store the UTC instant.
     */
    public static function localToUtcString(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return Carbon::parse($value, self::TIMEZONE)->utc()->format('Y-m-d H:i:s');
    }
}
