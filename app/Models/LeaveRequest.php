<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class LeaveRequest extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    /** @deprecated Use TYPE_AL */
    public const TYPE_LEAVE = 'leave';

    public const TYPE_AL = 'al';

    public const TYPE_SL = 'sl';

    public const TYPE_HL = 'hl';

    public const TYPE_CL = 'cl';

    public const TYPE_NPL = 'npl';

    public const TYPE_ML = 'ml';

    public const TYPE_PL = 'pl';

    public const TYPE_TOL = 'tol';

    /** @deprecated Removed from selectable leave types; kept for legacy rows. */
    public const TYPE_REMOTE = 'remote';

    public const PORTION_MORNING = 'morning';

    public const PORTION_AFTERNOON = 'afternoon';

    /**
     * @return list<string>
     */
    public static function types(): array
    {
        return array_keys(config('leave.types', []));
    }

    public static function normalizeType(string $type): string
    {
        return $type === self::TYPE_LEAVE ? self::TYPE_AL : $type;
    }

    /**
     * @return list<string>
     */
    public static function portions(): array
    {
        return [
            self::PORTION_MORNING,
            self::PORTION_AFTERNOON,
        ];
    }

    public function typeLabel(): string
    {
        $type = self::normalizeType($this->type);

        if ($type === self::TYPE_REMOTE) {
            return 'Remote work';
        }

        return (string) (config("leave.types.{$type}.label") ?? strtoupper($type));
    }

    public function typeCode(): string
    {
        $type = self::normalizeType($this->type);

        if ($type === self::TYPE_REMOTE) {
            return 'REMOTE';
        }

        return (string) (config("leave.types.{$type}.code") ?? strtoupper($type));
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'start_date',
        'end_date',
        'start_portion',
        'end_portion',
        'type',
        'reason',
        'attachment_disk',
        'attachment_path',
        'attachment_name',
        'status',
        'reviewed_by',
        'reviewed_at',
        'admin_notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeOverlapping(Builder $query, string $rangeStart, string $rangeEnd): Builder
    {
        return $query
            ->where('start_date', '<=', $rangeEnd)
            ->where('end_date', '>=', $rangeStart);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public static function inclusiveDayCount(string $startDate, string $endDate): int
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();

        return (int) $start->diffInDays($end) + 1;
    }

    public static function medicalCertificateThreshold(): int
    {
        return (int) config('leave.sl.medical_certificate_after_days', 2);
    }

    public static function requiresMedicalCertificateFor(
        string $type,
        string $startDate,
        string $endDate,
    ): bool {
        return self::normalizeType($type) === self::TYPE_SL
            && self::inclusiveDayCount($startDate, $endDate) > self::medicalCertificateThreshold();
    }

    public static function normalizePortion(?string $portion): string
    {
        return in_array($portion, self::portions(), true)
            ? $portion
            : self::PORTION_MORNING;
    }

    public static function calculateRequestedDays(
        string $startDate,
        string $endDate,
        ?string $startPortion = null,
        ?string $endPortion = null,
    ): float {
        $days = (float) self::inclusiveDayCount($startDate, $endDate);
        $normalizedStart = self::normalizePortion($startPortion);
        $normalizedEnd = self::normalizePortion($endPortion);

        if ($normalizedStart === self::PORTION_AFTERNOON) {
            $days -= 0.5;
        }

        if ($normalizedEnd === self::PORTION_MORNING) {
            $days -= 0.5;
        }

        return max(0.5, $days);
    }

    public static function isPortionRangeValid(
        string $startDate,
        string $endDate,
        ?string $startPortion = null,
        ?string $endPortion = null,
    ): bool {
        if ($startDate !== $endDate) {
            return true;
        }

        $normalizedStart = self::normalizePortion($startPortion);
        $normalizedEnd = self::normalizePortion($endPortion);

        return ! (
            $normalizedStart === self::PORTION_AFTERNOON
            && $normalizedEnd === self::PORTION_MORNING
        );
    }

    public function dayCount(): float
    {
        return self::calculateRequestedDays(
            $this->start_date->toDateString(),
            $this->end_date->toDateString(),
            $this->start_portion,
            $this->end_portion,
        );
    }

    public function hasAttachment(): bool
    {
        return $this->attachment_path !== null && $this->attachment_path !== '';
    }

    public function startPortionLabel(): string
    {
        return $this->portionLabel($this->start_portion, true);
    }

    public function endPortionLabel(): string
    {
        return $this->portionLabel($this->end_portion, false);
    }

    private function portionLabel(?string $portion, bool $isStart): string
    {
        return match (self::normalizePortion($portion)) {
            self::PORTION_AFTERNOON => $isStart ? 'Afternoon' : 'End of day',
            default => $isStart ? 'Morning' : 'Morning',
        };
    }

    public function deductsCredits(): bool
    {
        $type = self::normalizeType($this->type);

        return config("leave.types.{$type}.deduct") !== null;
    }
}
