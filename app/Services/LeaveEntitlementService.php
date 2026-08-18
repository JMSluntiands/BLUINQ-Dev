<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LeaveEntitlementService
{
    public function isEntitled(User $user): bool
    {
        return ($user->employment_status ?? 'regular') === 'regular';
    }

    /**
     * Continuous years of service as of a given date (based on date_hired).
     */
    public function continuousYears(User $user, ?Carbon $asOf = null): int
    {
        if (! $user->date_hired) {
            return 0;
        }

        $asOf = ($asOf ?? Carbon::today())->startOfDay();
        $hired = $user->date_hired->copy()->startOfDay();

        if ($hired->gt($asOf)) {
            return 0;
        }

        return (int) $hired->diffInYears($asOf);
    }

    /**
     * Annual AL entitlement for a calendar year.
     * Years 1–2: 12 days. From 3rd continuous year: +1/year until max 20.
     */
    public function annualAlEntitlement(User $user, ?int $year = null): int
    {
        $base = (int) config('leave.al.base_days', 12);
        $max = (int) config('leave.al.max_days', 20);
        $longevityStart = (int) config('leave.al.longevity_start_year', 3);

        if (! $this->isEntitled($user)) {
            return 0;
        }

        $year = $year ?? (int) now()->year;
        $asOf = Carbon::create($year, 12, 31)->startOfDay();
        $yearsCompleted = $this->continuousYears($user, $asOf);

        // 0–1 completed years => 1st/2nd year of service => base 12
        // 2 completed years => 3rd year => 13, then +1 per year to max 20
        if ($yearsCompleted < ($longevityStart - 1)) {
            return $base;
        }

        return min($max, $base + ($yearsCompleted - 1));
    }

    /**
     * @return array<string, mixed>
     */
    public function balancesFor(User $user): array
    {
        $this->ensureYearInitialized($user);
        $user->refresh();

        $status = $user->employment_status ?? 'regular';
        $statuses = config('leave.employment_statuses', []);
        $medicalCap = (float) config('leave.hl.max_days_including_sl', 60);
        $medicalUsed = (float) $user->medical_days_used;
        $carried = $this->usableCarriedOver($user);
        $alAvailable = (float) $user->al_credits + $carried;

        return [
            'entitled' => $this->isEntitled($user),
            'employment_status' => $status,
            'employment_status_label' => $statuses[$status] ?? ucfirst($status),
            'al_available' => $alAvailable,
            'al_credits' => (float) $user->al_credits,
            'al_carried_over' => $carried,
            'al_carry_expires_on' => $carried > 0 ? $user->al_carry_expires_on?->toDateString() : null,
            'al_entitlement' => $this->annualAlEntitlement($user),
            'continuous_years' => $this->continuousYears($user),
            'sl_credits' => (float) $user->sl_credits,
            'medical_days_used' => $medicalUsed,
            'medical_remaining' => max(0, $medicalCap - $medicalUsed),
            'leave_credits' => $alAvailable,
        ];
    }

    public function usableCarriedOver(User $user): float
    {
        $carried = (float) $user->al_carried_over;
        if ($carried <= 0) {
            return 0;
        }

        if ($user->al_carry_expires_on && Carbon::today()->gt($user->al_carry_expires_on)) {
            return 0;
        }

        return $carried;
    }

    public function syncLegacyLeaveCredits(User $user): void
    {
        $available = (float) $user->al_credits + $this->usableCarriedOver($user);
        if ((float) $user->leave_credits !== $available) {
            $user->forceFill(['leave_credits' => $available])->save();
        }
    }

    public function ensureYearInitialized(User $user, ?Carbon $today = null): void
    {
        $today = $today ?? Carbon::today();
        $year = (int) $today->year;

        if ((int) $user->leave_balance_year === $year) {
            $this->expireCarriedOverIfNeeded($user, $today);

            return;
        }

        DB::transaction(function () use ($user, $year, $today): void {
            $user->refresh();

            if ((int) $user->leave_balance_year === $year) {
                $this->expireCarriedOverIfNeeded($user, $today);

                return;
            }

            if (! $this->isEntitled($user)) {
                $user->forceFill([
                    'leave_balance_year' => $year,
                    'al_credits' => 0,
                    'al_carried_over' => 0,
                    'al_carry_expires_on' => null,
                    'sl_credits' => 0,
                    'medical_days_used' => 0,
                    'al_last_accrual_month' => null,
                    'leave_credits' => 0,
                ])->save();

                return;
            }

            $previousAl = (float) $user->al_credits + $this->usableCarriedOver($user);
            $carryMax = (int) config('leave.al.carry_over_max', 7);
            $carried = min($carryMax, max(0, $previousAl));
            $expireMonth = (int) config('leave.al.carry_expire_month', 6);
            $expireDay = (int) config('leave.al.carry_expire_day', 30);

            $user->forceFill([
                'leave_balance_year' => $year,
                'al_credits' => 0,
                'al_carried_over' => $carried,
                'al_carry_expires_on' => $carried > 0
                    ? Carbon::create($year, $expireMonth, $expireDay)->toDateString()
                    : null,
                'sl_credits' => (int) config('leave.sl.annual_days', 15),
                'medical_days_used' => 0,
                'al_last_accrual_month' => null,
            ])->save();

            $this->syncLegacyLeaveCredits($user);
            $this->accrueMonthlyAl($user, $today);
        });
    }

    public function expireCarriedOverIfNeeded(User $user, ?Carbon $today = null): void
    {
        $today = $today ?? Carbon::today();

        if ((float) $user->al_carried_over <= 0) {
            return;
        }

        if (! $user->al_carry_expires_on || $today->lte($user->al_carry_expires_on)) {
            return;
        }

        $user->forceFill([
            'al_carried_over' => 0,
            'al_carry_expires_on' => null,
        ])->save();

        $this->syncLegacyLeaveCredits($user);
    }

    /**
     * Accrue monthly AL (+1), plus longevity top-up on the first accrual of the year.
     */
    public function accrueMonthlyAl(User $user, ?Carbon $asOf = null): bool
    {
        $asOf = $asOf ?? Carbon::today();
        $monthKey = $asOf->format('Y-m');

        if (! $this->isEntitled($user)) {
            return false;
        }

        $this->ensureYearInitialized($user, $asOf);
        $user->refresh();

        if ($user->al_last_accrual_month === $monthKey) {
            return false;
        }

        if ($user->date_hired) {
            $hireMonth = $user->date_hired->format('Y-m');
            if ($monthKey < $hireMonth) {
                return false;
            }
        }

        $entitlement = $this->annualAlEntitlement($user, (int) $asOf->year);
        $monthly = (int) config('leave.al.monthly_accrual', 1);
        $base = (int) config('leave.al.base_days', 12);
        $current = (float) $user->al_credits;

        if ($current >= $entitlement) {
            $user->forceFill(['al_last_accrual_month' => $monthKey])->save();

            return false;
        }

        $add = $monthly;

        // First accrual of the year: grant longevity extras (entitlement - 12) immediately.
        $isFirstAccrualThisYear = $user->al_last_accrual_month === null
            || ! str_starts_with((string) $user->al_last_accrual_month, (string) $asOf->year);

        if ($isFirstAccrualThisYear) {
            $add += max(0, $entitlement - $base);
        }

        $add = min($add, $entitlement - $current);

        if ($add <= 0) {
            $user->forceFill(['al_last_accrual_month' => $monthKey])->save();

            return false;
        }

        $user->forceFill([
            'al_credits' => $current + $add,
            'al_last_accrual_month' => $monthKey,
        ])->save();

        $this->syncLegacyLeaveCredits($user);

        return true;
    }

    /**
     * @return array{accrued: int, initialized: int, expired_carry: int}
     */
    public function processAllUsers(?Carbon $asOf = null): array
    {
        $asOf = $asOf ?? Carbon::today();
        $stats = ['accrued' => 0, 'initialized' => 0, 'expired_carry' => 0];

        User::query()->active()->orderBy('id')->chunkById(50, function ($users) use ($asOf, &$stats): void {
            foreach ($users as $user) {
                $beforeYear = $user->leave_balance_year;
                $beforeCarry = (float) $user->al_carried_over;

                $this->ensureYearInitialized($user, $asOf);
                $user->refresh();

                if ($beforeYear !== $user->leave_balance_year) {
                    $stats['initialized']++;
                }

                if ($beforeCarry > 0 && (float) $user->al_carried_over === 0.0) {
                    $stats['expired_carry']++;
                }

                if ($this->accrueMonthlyAl($user, $asOf)) {
                    $stats['accrued']++;
                }
            }
        });

        return $stats;
    }
}
