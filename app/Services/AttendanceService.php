<?php

namespace App\Services;

use App\Models\AttendanceClock;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class AttendanceService
{
    public function attendanceTimezone(): string
    {
        return (string) config('attendance.timezone', 'Asia/Manila');
    }

    public function absentCutoff(): string
    {
        return (string) config('attendance.absent_cutoff', '09:00');
    }

    public function nowInAttendanceTimezone(): \Illuminate\Support\Carbon
    {
        return now($this->attendanceTimezone());
    }

    public function todayForUser(User $user): AttendanceClock
    {
        return AttendanceClock::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'work_date' => $this->nowInAttendanceTimezone()->toDateString(),
            ],
        );
    }

    public function isAbsentCutoffReached(): bool
    {
        $now = $this->nowInAttendanceTimezone();

        if ($now->isWeekend()) {
            return false;
        }

        return $now->format('H:i') >= $this->absentCutoff();
    }

    /**
     * Active users who have not clocked in today after 9:00 AM.
     *
     * @return Collection<int, User>
     */
    public function absentUsersToday(): Collection
    {
        if (! $this->isAbsentCutoffReached()) {
            return collect();
        }

        $today = $this->nowInAttendanceTimezone()->toDateString();

        $clockedInUserIds = AttendanceClock::query()
            ->whereDate('work_date', $today)
            ->whereNotNull('clock_in_at')
            ->pluck('user_id');

        return User::query()
            ->active()
            ->whereNotIn('id', $clockedInUserIds)
            ->orderBy('name')
            ->get();
    }

    /**
     * Active users who clocked in today (includes administrators).
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function clockedInUsersToday(): Collection
    {
        $today = $this->nowInAttendanceTimezone()->toDateString();
        $timezone = $this->attendanceTimezone();

        return AttendanceClock::query()
            ->whereDate('work_date', $today)
            ->whereNotNull('clock_in_at')
            ->with(['user' => fn ($query) => $query->active()])
            ->get()
            ->filter(fn (AttendanceClock $clock) => $clock->user !== null)
            ->map(function (AttendanceClock $clock) use ($timezone) {
                return array_merge(
                    $this->formatUserForDashboard($clock->user),
                    [
                        'clock_in_time' => $this->formatClockTime(
                            $clock->clock_in_at,
                            $timezone,
                        ),
                    ],
                );
            })
            ->sortBy('name')
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    public function formatUserForDashboard(User $user): array
    {
        $name = trim((string) $user->name);

        if ($name === '') {
            $name = Str::headline(
                str_replace(['.', '_'], ' ', Str::before($user->email, '@')),
            );
        }

        return [
            'id' => $user->id,
            'name' => $name,
            'email' => $user->email,
            'department' => $user->company_name ?: null,
            'profile_image_url' => $user->profile_image_url,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function formatClockTime(?\Illuminate\Support\Carbon $value, string $timezone): ?string
    {
        if ($value === null) {
            return null;
        }

        return $value->timezone($timezone)->format('g:i A');
    }

    /**
     * @return array<string, mixed>
     */
    public function clockStateForUser(User $user): array
    {
        $record = $this->todayForUser($user);
        $defaultTimezone = $this->attendanceTimezone();
        $nowLocal = $this->nowInAttendanceTimezone();

        return [
            'clocked_in' => $record->clock_in_at !== null,
            'clocked_out' => $record->clock_out_at !== null,
            'clock_in_at' => $record->clock_in_at?->toIso8601String(),
            'clock_out_at' => $record->clock_out_at?->toIso8601String(),
            'clock_in_time' => $this->formatClockTime(
                $record->clock_in_at,
                $defaultTimezone,
            ),
            'clock_out_time' => $this->formatClockTime(
                $record->clock_out_at,
                $defaultTimezone,
            ),
            'timezone' => $defaultTimezone,
            'timezones' => config('attendance.display_timezones', []),
            'current_local_time' => $nowLocal->format('g:i A'),
            'current_local_date' => $nowLocal->format('D, M j, Y'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboardAttendancePayload(): array
    {
        return [
            'present' => $this->clockedInUsersToday()->all(),
            'absent' => $this->absentUsersToday()
                ->map(fn (User $user) => $this->formatUserForDashboard($user))
                ->values()
                ->all(),
            'absent_after_nine' => $this->isAbsentCutoffReached(),
            'absent_cutoff_label' => $this->absentCutoff(),
            'timezone' => $this->attendanceTimezone(),
            'clocked_in_today' => AttendanceClock::query()
                ->whereDate('work_date', $this->nowInAttendanceTimezone()->toDateString())
                ->whereNotNull('clock_in_at')
                ->count(),
        ];
    }
}
