<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DraftingRequest extends Model
{
    protected $fillable = [
        'user_id',
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
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'max_building_area_sqm' => 'decimal:2',
            'ndis_sda' => 'boolean',
        ];
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
}
