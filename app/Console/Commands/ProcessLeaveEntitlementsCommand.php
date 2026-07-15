<?php

namespace App\Console\Commands;

use App\Services\LeaveEntitlementService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ProcessLeaveEntitlementsCommand extends Command
{
    protected $signature = 'leave:process-entitlements {--date= : Process as of YYYY-MM-DD}';

    protected $description = 'Accrue monthly AL, refresh yearly SL, expire AL carry-over after June';

    public function handle(LeaveEntitlementService $entitlements): int
    {
        $dateOption = $this->option('date');
        $asOf = $dateOption
            ? Carbon::createFromFormat('Y-m-d', $dateOption)->startOfDay()
            : Carbon::today();

        $this->info('Processing leave entitlements as of '.$asOf->toDateString().'...');

        $stats = $entitlements->processAllUsers($asOf);

        $this->info("Year initialized: {$stats['initialized']}");
        $this->info("Monthly AL accrued: {$stats['accrued']}");
        $this->info("Carry-over expired: {$stats['expired_carry']}");

        return self::SUCCESS;
    }
}
