<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CrmQuote extends Model
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
        'client_company_name',
        'project_job_number',
        'site_address',
        'site_owner_name',
        'arrival_input_file_id',
        'crm_category_id',
        'level_of_difficulty_id',
        'building_type_id',
        'scope_of_work_id',
        'deliverable_id',
        'building_area_size',
        'estimated_time_allocation',
        'remarks',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function arrivalInputFile(): BelongsTo
    {
        return $this->belongsTo(ArrivalInputFile::class);
    }

    public function crmCategory(): BelongsTo
    {
        return $this->belongsTo(CrmCategory::class);
    }

    public function levelOfDifficulty(): BelongsTo
    {
        return $this->belongsTo(LevelOfDifficulty::class);
    }

    public function buildingType(): BelongsTo
    {
        return $this->belongsTo(BuildingType::class);
    }

    public function scopeOfWork(): BelongsTo
    {
        return $this->belongsTo(ScopeOfWork::class);
    }

    public function deliverable(): BelongsTo
    {
        return $this->belongsTo(Deliverable::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(CrmQuoteComment::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(CrmQuoteActivity::class)->latest();
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
