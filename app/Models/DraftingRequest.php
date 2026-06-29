<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DraftingRequest extends Model
{
    public const STATUS_NEW = 'new';

    public const STATUS_ASSIGNED = 'assigned';

    public const STATUS_WIP = 'wip';

    public const STATUS_FOR_CHECKING = 'for_checking';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_ON_HOLD = 'on_hold';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_FOR_QUOTE = 'for_quote';

    public const STATUS_QUOTE_SENT = 'quote_sent';

    public const STATUS_INVOICED = 'invoiced';

    public const STATUS_PAID = 'paid';

    public const REVIEW_PENDING = 'pending';

    public const REVIEW_ACCEPTED = 'accepted';

    public const REVIEW_REJECTED = 'rejected';

    /**
     * @return array<string, string>
     */
    public static function statusOptions(): array
    {
        return [
            self::STATUS_NEW => 'New',
            self::STATUS_ASSIGNED => 'Assigned',
            self::STATUS_WIP => 'WIP',
            self::STATUS_FOR_CHECKING => 'For Checking',
            self::STATUS_SUBMITTED => 'Submitted',
            self::STATUS_ON_HOLD => 'On Hold',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_FOR_QUOTE => 'For Quote',
            self::STATUS_QUOTE_SENT => 'Quote Sent',
            self::STATUS_INVOICED => 'Invoiced',
            self::STATUS_PAID => 'Paid',
        ];
    }

    /**
     * @return list<string>
     */
    public static function statusValues(): array
    {
        return array_keys(self::statusOptions());
    }

    protected $fillable = [
        'user_id',
        'status',
        'is_priority',
        'requested_at',
        'your_name',
        'company_name',
        'email',
        'site_address',
        'site_owner_name',
        'max_building_area_sqm',
        'design_requirements',
        'building_type_id',
        'zoning',
        'ndis_sda',
        'external_wall_construction_id',
        'roof_type_id',
        'ceiling_heights',
        'first_floor_slab',
        'additional_inclusions',
        'archived_at',
        'review_status',
        'reviewed_by',
        'reviewed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'archived_at' => 'datetime',
            'max_building_area_sqm' => 'decimal:2',
            'ndis_sda' => 'boolean',
            'is_priority' => 'boolean',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeReviewAccepted(Builder $query): Builder
    {
        return $query->where('review_status', self::REVIEW_ACCEPTED);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function jobNumber(): string
    {
        $at = $this->requested_at ?? $this->created_at;

        $year = $at !== null
            ? $at->timezone(config('app.timezone'))->format('y')
            : now(config('app.timezone'))->format('y');

        return sprintf('%s%03d', $year, $this->id);
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

    /**
     * @return BelongsTo<BuildingType, $this>
     */
    public function buildingType(): BelongsTo
    {
        return $this->belongsTo(BuildingType::class);
    }

    /**
     * @return BelongsTo<ExternalWallConstruction, $this>
     */
    public function externalWallConstruction(): BelongsTo
    {
        return $this->belongsTo(ExternalWallConstruction::class);
    }

    /**
     * @return BelongsTo<RoofType, $this>
     */
    public function roofType(): BelongsTo
    {
        return $this->belongsTo(RoofType::class);
    }

    /**
     * @return BelongsToMany<ServiceEngaging, $this>
     */
    public function serviceEngagings(): BelongsToMany
    {
        return $this->belongsToMany(ServiceEngaging::class, 'drafting_request_service_engaging');
    }

    /**
     * @return HasMany<DraftingRequestFile, $this>
     */
    public function files(): HasMany
    {
        return $this->hasMany(DraftingRequestFile::class);
    }

    /**
     * @return HasMany<DraftingRequestComment, $this>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(DraftingRequestComment::class);
    }

    /**
     * @return HasMany<DraftingRequestActivity, $this>
     */
    public function activities(): HasMany
    {
        return $this->hasMany(DraftingRequestActivity::class)->latest();
    }

    /**
     * @return HasMany<DraftingRequestRevision, $this>
     */
    public function revisions(): HasMany
    {
        return $this->hasMany(DraftingRequestRevision::class)
            ->orderByDesc('log_date')
            ->orderByDesc('id');
    }

    /**
     * @return HasMany<DraftingRequestAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(DraftingRequestAssignment::class)
            ->orderBy('role')
            ->orderBy('slot');
    }

    /**
     * @return HasMany<DraftingRequestAccountEntry, $this>
     */
    public function accountEntries(): HasMany
    {
        return $this->hasMany(DraftingRequestAccountEntry::class)
            ->orderByDesc('id');
    }

    public function statusLabel(): string
    {
        if ($this->status === null || $this->status === '') {
            return self::statusOptions()[self::STATUS_NEW];
        }

        return self::statusOptions()[$this->status]
            ?? ucfirst(str_replace('_', ' ', $this->status));
    }
}
