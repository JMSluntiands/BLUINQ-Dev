<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class LeaveService
{
    public function __construct(
        private LeaveEntitlementService $entitlements,
    ) {}

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    public function monthGridRange(Carbon $month): array
    {
        $start = $month->copy()->startOfMonth()->startOfWeek(Carbon::SUNDAY);
        $end = $month->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY);

        return [$start, $end];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function calendarPayload(Carbon $rangeStart, Carbon $rangeEnd): array
    {
        $startKey = $rangeStart->toDateString();
        $endKey = $rangeEnd->toDateString();

        $users = User::query()
            ->active()
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'birthday',
                'profile_image',
                'leave_credits',
                'al_credits',
                'al_carried_over',
                'al_carry_expires_on',
                'employment_status',
                'date_hired',
                'sl_credits',
                'medical_days_used',
                'leave_balance_year',
            ]);

        $requests = LeaveRequest::query()
            ->with('user:id,name')
            ->approved()
            ->overlapping($startKey, $endKey)
            ->get();

        $requestsByUser = $requests->groupBy('user_id');

        return $users->map(function (User $user) use ($requestsByUser, $rangeStart, $rangeEnd) {
            $balances = $this->entitlements->balancesFor($user);
            $marks = $this->buildMarksForUser(
                $user,
                $requestsByUser->get($user->id, collect()),
                $rangeStart,
                $rangeEnd,
            );

            return [
                'id' => $user->id,
                'name' => $user->name,
                'profile_image_url' => $user->profile_image_url,
                'balance' => $balances['al_available'],
                'balances' => $balances,
                'marks' => $marks,
            ];
        })->values()->all();
    }

    /**
     * @return list<array{id: int, name: string, department: string, date: string, profile_image_url: string|null}>
     */
    public function upcomingBirthdays(int $limit = 5): array
    {
        $today = Carbon::today();

        return User::query()
            ->active()
            ->whereNotNull('birthday')
            ->orderBy('name')
            ->get(['id', 'name', 'birthday', 'job_title', 'profile_image'])
            ->map(function (User $user) use ($today) {
                $occurrence = $user->birthday->copy()->year($today->year);

                if ($occurrence->lt($today)) {
                    $occurrence->addYear();
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'department' => $user->job_title ?? '',
                    'date' => $occurrence->format('M j'),
                    'profile_image_url' => $user->profile_image_url,
                    'sort_key' => $occurrence->format('Y-m-d'),
                ];
            })
            ->sortBy('sort_key')
            ->take($limit)
            ->map(fn (array $entry) => array_diff_key($entry, ['sort_key' => true]))
            ->values()
            ->all();
    }

    public function creditsForUser(User $user): int
    {
        return $this->entitlements->balancesFor($user)['al_available'];
    }

    /**
     * @return array<string, mixed>
     */
    public function balancesForUser(User $user): array
    {
        return $this->entitlements->balancesFor($user);
    }

    public function addCredits(
        User $employee,
        int $amount,
        User $actor,
        ?string $notes = null,
        string $bucket = 'al',
    ): void {
        DB::transaction(function () use ($employee, $amount, $actor, $notes, $bucket): void {
            $employee->refresh();
            $this->entitlements->ensureYearInitialized($employee);
            $employee->refresh();

            if ($bucket === 'sl') {
                $employee->increment('sl_credits', $amount);
            } else {
                $employee->increment('al_credits', $amount);
                $this->entitlements->syncLegacyLeaveCredits($employee->fresh());
            }

            $employee->refresh();
            $this->logCreditChange(
                employee: $employee,
                actor: $actor,
                amount: $amount,
                action: 'manual_add',
                notes: ($notes ? $notes.' ' : '').'['.strtoupper($bucket).']',
            );
        });
    }

    public function deductCreditsForApprovedLeave(LeaveRequest $leaveRequest, User $actor): void
    {
        $type = LeaveRequest::normalizeType($leaveRequest->type);
        $deduct = config("leave.types.{$type}.deduct");

        if ($deduct === null) {
            return;
        }

        $days = $leaveRequest->dayCount();
        $employee = $leaveRequest->user()->lockForUpdate()->firstOrFail();

        $this->entitlements->ensureYearInitialized($employee);
        $employee->refresh();

        if (! $this->entitlements->isEntitled($employee)) {
            throw new RuntimeException(
                "{$employee->name} is on probation/training and is not entitled to {$type} leave credits.",
            );
        }

        match ($deduct) {
            'al' => $this->deductAnnualLeave($employee, $days, $actor, $leaveRequest),
            'sl' => $this->deductSickLeave($employee, $days, $actor, $leaveRequest),
            'hl' => $this->deductHospitalizationLeave($employee, $days, $actor, $leaveRequest),
            default => null,
        };
    }

    private function deductAnnualLeave(
        User $employee,
        int $days,
        User $actor,
        LeaveRequest $leaveRequest,
    ): void {
        $carried = $this->entitlements->usableCarriedOver($employee);
        $available = (int) $employee->al_credits + $carried;

        if ($available < $days) {
            throw new RuntimeException(
                "Insufficient AL credits. {$employee->name} has {$available} day(s) but this request needs {$days}.",
            );
        }

        $fromCarry = min($carried, $days);
        $fromCurrent = $days - $fromCarry;

        $employee->forceFill([
            'al_carried_over' => $carried - $fromCarry,
            'al_credits' => (int) $employee->al_credits - $fromCurrent,
            'al_carry_expires_on' => ($carried - $fromCarry) > 0
                ? $employee->al_carry_expires_on
                : null,
        ])->save();

        $this->entitlements->syncLegacyLeaveCredits($employee->fresh());
        $employee->refresh();

        $this->logCreditChange(
            employee: $employee,
            actor: $actor,
            amount: -$days,
            action: 'leave_approved',
            leaveRequest: $leaveRequest,
        );
    }

    private function deductSickLeave(
        User $employee,
        int $days,
        User $actor,
        LeaveRequest $leaveRequest,
    ): void {
        $medicalCap = (int) config('leave.hl.max_days_including_sl', 60);
        $medicalUsed = (int) $employee->medical_days_used;
        $sl = (int) $employee->sl_credits;

        if ($sl < $days) {
            throw new RuntimeException(
                "Insufficient SL credits. {$employee->name} has {$sl} day(s) but this request needs {$days}.",
            );
        }

        if (($medicalUsed + $days) > $medicalCap) {
            throw new RuntimeException(
                "Medical leave cap exceeded. {$employee->name} has used {$medicalUsed} of {$medicalCap} SL/HL days.",
            );
        }

        $employee->forceFill([
            'sl_credits' => $sl - $days,
            'medical_days_used' => $medicalUsed + $days,
        ])->save();

        $this->logCreditChange(
            employee: $employee,
            actor: $actor,
            amount: -$days,
            action: 'leave_approved',
            leaveRequest: $leaveRequest,
        );
    }

    private function deductHospitalizationLeave(
        User $employee,
        int $days,
        User $actor,
        LeaveRequest $leaveRequest,
    ): void {
        $medicalCap = (int) config('leave.hl.max_days_including_sl', 60);
        $medicalUsed = (int) $employee->medical_days_used;
        $remaining = $medicalCap - $medicalUsed;

        if ($days > $remaining) {
            throw new RuntimeException(
                "Hospitalization leave cap exceeded. {$employee->name} has {$remaining} of {$medicalCap} medical day(s) remaining (includes SL).",
            );
        }

        $employee->forceFill([
            'medical_days_used' => $medicalUsed + $days,
        ])->save();

        $this->logCreditChange(
            employee: $employee,
            actor: $actor,
            amount: -$days,
            action: 'leave_approved',
            leaveRequest: $leaveRequest,
        );
    }

    private function logCreditChange(
        User $employee,
        User $actor,
        int $amount,
        string $action,
        ?string $notes = null,
        ?LeaveRequest $leaveRequest = null,
    ): void {
        $employee->refresh();
        $balances = $this->entitlements->balancesFor($employee);

        $description = match ($action) {
            'manual_add' => "Added {$amount} leave credit(s) to {$employee->name}. AL: {$balances['al_available']}, SL: {$balances['sl_credits']}.",
            'leave_approved' => sprintf(
                'Deducted %d day(s) from %s for approved %s #%d. AL: %d, SL: %d, medical used: %d.',
                abs($amount),
                $employee->name,
                $leaveRequest?->typeCode() ?? 'LEAVE',
                $leaveRequest?->id ?? 0,
                $balances['al_available'],
                $balances['sl_credits'],
                $balances['medical_days_used'],
            ),
            default => "Leave credits updated for {$employee->name}.",
        };

        if ($notes) {
            $description .= " Note: {$notes}";
        }

        DB::table('activity_logs')->insert([
            'user_id' => $actor->id,
            'method' => 'LEAVE',
            'route_name' => $action,
            'path' => $description,
            'status_code' => 200,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function pendingCount(): int
    {
        return LeaveRequest::query()->pending()->count();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function onLeaveToday(): array
    {
        $today = now()->toDateString();

        return LeaveRequest::query()
            ->approved()
            ->whereNotIn('type', [LeaveRequest::TYPE_REMOTE])
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->with('user:id,name,job_title,profile_image')
            ->orderBy('end_date')
            ->get()
            ->map(fn (LeaveRequest $request) => [
                'id' => $request->user_id,
                'name' => $request->user->name,
                'department' => $request->user->job_title ?? '',
                'until' => $request->end_date->format('M j'),
                'type' => $request->typeCode(),
                'profile_image_url' => $request->user->profile_image_url,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, string>
     */
    private function buildMarksForUser(
        User $user,
        Collection $requests,
        Carbon $rangeStart,
        Carbon $rangeEnd,
    ): array {
        $marks = [];

        foreach (CarbonPeriod::create($rangeStart, $rangeEnd) as $day) {
            if ($user->birthday) {
                $birthday = $user->birthday->copy()->year($day->year);
                if ($birthday->toDateString() === $day->toDateString()) {
                    $marks[$day->toDateString()] = 'birthday';
                    continue;
                }
            }

            foreach ($requests as $request) {
                if ($day->between($request->start_date, $request->end_date)) {
                    $marks[$day->toDateString()] = LeaveRequest::normalizeType($request->type) === LeaveRequest::TYPE_REMOTE
                        ? 'remote'
                        : 'leave';
                    break;
                }
            }
        }

        return $marks;
    }

    /**
     * @return array<string, mixed>
     */
    public function formatForApproval(LeaveRequest $request): array
    {
        $request->loadMissing([
            'user:id,name,job_title,profile_image,leave_credits,al_credits,al_carried_over,al_carry_expires_on,sl_credits,medical_days_used,employment_status,date_hired,leave_balance_year',
            'reviewer:id,name',
        ]);

        $balances = $this->entitlements->balancesFor($request->user);
        $days = $request->dayCount();
        $type = LeaveRequest::normalizeType($request->type);
        $deduct = config("leave.types.{$type}.deduct");
        $needsDeduction = $deduct !== null;
        $hasEnoughCredits = true;

        if ($deduct === 'al') {
            $hasEnoughCredits = $balances['al_available'] >= $days;
        } elseif ($deduct === 'sl') {
            $hasEnoughCredits = $balances['sl_credits'] >= $days
                && $balances['medical_remaining'] >= $days;
        } elseif ($deduct === 'hl') {
            $hasEnoughCredits = $balances['medical_remaining'] >= $days;
        }

        return [
            'id' => $request->id,
            'user' => [
                'id' => $request->user->id,
                'name' => $request->user->name,
                'job_title' => $request->user->job_title,
                'profile_image_url' => $request->user->profile_image_url,
                'leave_credits' => $balances['al_available'],
                'balances' => $balances,
            ],
            'start_date' => $request->start_date->format('Y-m-d'),
            'end_date' => $request->end_date->format('Y-m-d'),
            'start_display' => $request->start_date->format('M j, Y'),
            'end_display' => $request->end_date->format('M j, Y'),
            'days' => $days,
            'type' => $type,
            'type_label' => $request->typeLabel(),
            'type_code' => $request->typeCode(),
            'reason' => $request->reason,
            'status' => $request->status,
            'submitted_at' => $request->created_at?->format('M j, Y g:i A'),
            'reviewed_by' => $request->reviewer?->name,
            'reviewed_at' => $request->reviewed_at?->format('M j, Y g:i A'),
            'admin_notes' => $request->admin_notes,
            'has_enough_credits' => $hasEnoughCredits,
            'credits_required' => $needsDeduction ? $days : 0,
            'deducts_credits' => $needsDeduction,
        ];
    }
}
