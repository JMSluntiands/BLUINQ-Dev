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
            ->get(['id', 'name', 'birthday', 'profile_image', 'leave_credits']);

        $requests = LeaveRequest::query()
            ->with('user:id,name')
            ->approved()
            ->overlapping($startKey, $endKey)
            ->get();

        $requestsByUser = $requests->groupBy('user_id');

        return $users->map(function (User $user) use ($requestsByUser, $rangeStart, $rangeEnd) {
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
                'balance' => $this->creditsForUser($user),
                'marks' => $marks,
            ];
        })->values()->all();
    }

    public function creditsForUser(User $user): int
    {
        return (int) $user->leave_credits;
    }

    public function addCredits(User $employee, int $amount, User $actor, ?string $notes = null): void
    {
        DB::transaction(function () use ($employee, $amount, $actor, $notes): void {
            $employee->refresh();
            $employee->increment('leave_credits', $amount);

            $this->logCreditChange(
                employee: $employee,
                actor: $actor,
                amount: $amount,
                action: 'manual_add',
                notes: $notes,
            );
        });
    }

    public function deductCreditsForApprovedLeave(LeaveRequest $leaveRequest, User $actor): void
    {
        if ($leaveRequest->type !== LeaveRequest::TYPE_LEAVE) {
            return;
        }

        $days = $leaveRequest->dayCount();
        $employee = $leaveRequest->user()->lockForUpdate()->firstOrFail();

        if ($employee->leave_credits < $days) {
            throw new RuntimeException(
                "Insufficient leave credits. {$employee->name} has {$employee->leave_credits} credit(s) but this request needs {$days}.",
            );
        }

        $employee->decrement('leave_credits', $days);

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

        $description = match ($action) {
            'manual_add' => "Added {$amount} leave credit(s) to {$employee->name}. New balance: {$employee->leave_credits}.",
            'leave_approved' => "Deducted ".abs($amount)." leave credit(s) from {$employee->name} for approved leave #{$leaveRequest?->id}. New balance: {$employee->leave_credits}.",
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
            ->where('type', LeaveRequest::TYPE_LEAVE)
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
                    $marks[$day->toDateString()] = $request->type === LeaveRequest::TYPE_REMOTE
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
        $request->loadMissing(['user:id,name,job_title,profile_image,leave_credits', 'reviewer:id,name']);

        $credits = $this->creditsForUser($request->user);
        $days = $request->dayCount();
        $needsDeduction = $request->type === LeaveRequest::TYPE_LEAVE;
        $hasEnoughCredits = ! $needsDeduction || $credits >= $days;

        return [
            'id' => $request->id,
            'user' => [
                'id' => $request->user->id,
                'name' => $request->user->name,
                'job_title' => $request->user->job_title,
                'profile_image_url' => $request->user->profile_image_url,
                'leave_credits' => $credits,
            ],
            'start_date' => $request->start_date->format('Y-m-d'),
            'end_date' => $request->end_date->format('Y-m-d'),
            'start_display' => $request->start_date->format('M j, Y'),
            'end_display' => $request->end_date->format('M j, Y'),
            'days' => $days,
            'type' => $request->type,
            'type_label' => $request->type === LeaveRequest::TYPE_REMOTE ? 'Remote work' : 'Leave',
            'reason' => $request->reason,
            'status' => $request->status,
            'submitted_at' => $request->created_at?->format('M j, Y g:i A'),
            'reviewed_by' => $request->reviewer?->name,
            'reviewed_at' => $request->reviewed_at?->format('M j, Y g:i A'),
            'admin_notes' => $request->admin_notes,
            'has_enough_credits' => $hasEnoughCredits,
            'credits_required' => $needsDeduction ? $days : 0,
        ];
    }
}
