<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// First successful run each month grants +1 AL per regular employee and writes an activity log.
// Daily at 01:00 so the 1st is covered, and a missed 1st still catches up the next day.
Schedule::command('leave:process-entitlements')->dailyAt('01:00');
