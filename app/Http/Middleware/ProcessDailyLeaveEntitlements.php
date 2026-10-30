<?php

namespace App\Http\Middleware;

use App\Services\LeaveEntitlementService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Fallback for hosts without a cron running `schedule:run`: the first signed-in
 * request each day runs leave:process-entitlements after the response is sent.
 * Accrual is once per month per user, so running it again is harmless.
 */
class ProcessDailyLeaveEntitlements
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->user() === null || app()->runningUnitTests()) {
            return $response;
        }

        $today = now()->toDateString();

        if (Cache::add('leave-entitlements-processed:'.$today, true, now()->endOfDay())) {
            app()->terminating(function () use ($today): void {
                try {
                    app(LeaveEntitlementService::class)->processAllUsers();
                } catch (Throwable $e) {
                    Cache::forget('leave-entitlements-processed:'.$today);
                    report($e);
                }
            });
        }

        return $response;
    }
}
