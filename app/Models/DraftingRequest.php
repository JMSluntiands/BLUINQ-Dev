<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DraftingRequest extends Model
{
    public const STATUS_ALLOCATED = 'allocated';

    public const STATUS_PENDING = 'pending';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_ON_HOLD = 'on_hold';

    /**
     * @return array<string, string>
     */
    public static function statusOptions(): array
    {
        return [
            self::STATUS_ALLOCATED => 'Allocated',
            self::STATUS_PENDING => 'Pending',
            self::STATUS_IN_PROGRESS => 'In progress',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_ON_HOLD => 'On hold',
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
        'requested_at',
        'your_name',
        'company_name',
        'email',
        'site_address',
        'site_owner_name',
        'max_building_area_sqm',
        'design_requirements',
        'building_type_id',
        'ndis_sda',
        'external_wall_construction_id',
        'roof_type_id',
        'ceiling_heights',
        'first_floor_slab',
        'additional_inclusions',
        'archived_at',
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
        ];
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

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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

    public function statusLabel(): string
    {
        if ($this->status === null || $this->status === '') {
            return self::statusOptions()[self::STATUS_ALLOCATED];
        }

        return self::statusOptions()[$this->status]
            ?? ucfirst(str_replace('_', ' ', $this->status));
    }
}
