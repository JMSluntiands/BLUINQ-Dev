<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public const TYPE_REMOTE = 'remote';

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

    public function typeLabel(): string
    {
        $type = self::normalizeType($this->type);

        return (string) (config("leave.types.{$type}.label") ?? strtoupper($type));
    }

    public function typeCode(): string
    {
        $type = self::normalizeType($this->type);

        return (string) (config("leave.types.{$type}.code") ?? strtoupper($type));
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'start_date',
        'end_date',
        'type',
        'reason',
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

    public function dayCount(): int
    {
        return (int) $this->start_date->diffInDays($this->end_date) + 1;
    }

    public function deductsCredits(): bool
    {
        $type = self::normalizeType($this->type);

        return config("leave.types.{$type}.deduct") !== null;
    }
}
