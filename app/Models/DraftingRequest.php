<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DraftingRequest extends Model
{
    /** APM board section statuses (Archi). */
    public const STATUS_DRAFTING_WIP = 'drafting_wip';

    public const STATUS_DESIGN_WIP = 'design_wip';

    public const STATUS_FOR_QUOTES = 'for_quotes';

    public const STATUS_COMPLETED_PROJECTS = 'completed_projects';

    public const STATUS_CANCELLED_JOBS = 'cancelled_jobs';

    /** @deprecated Legacy — remapped to APM section statuses */
    public const STATUS_NEW = 'new';

    /** @deprecated Legacy — remapped to drafting_wip */
    public const STATUS_ASSIGNED = 'assigned';

    /** @deprecated Prefer STATUS_DRAFTING_WIP — kept for existing rows */
    public const STATUS_WIP = 'wip';

    /** @deprecated Legacy — remapped to drafting_wip */
    public const STATUS_FOR_CHECKING = 'for_checking';

    /** @deprecated Legacy — remapped to drafting_wip */
    public const STATUS_ON_HOLD = 'on_hold';

    /** @deprecated Legacy — remapped to drafting_wip */
    public const STATUS_QUERY = 'query';

    /** @deprecated Legacy — remapped to completed_projects */
    public const STATUS_SUBMITTED = 'submitted';

    /** @deprecated Prefer STATUS_CANCELLED_JOBS */
    public const STATUS_CANCELLED = 'cancelled';

    /** @deprecated Prefer STATUS_FOR_QUOTES */
    public const STATUS_FOR_QUOTE = 'for_quote';

    /** @deprecated Legacy — remapped to for_quotes */
    public const STATUS_QUOTE_SENT = 'quote_sent';

    /** @deprecated Legacy — remapped to completed_projects */
    public const STATUS_INVOICED = 'invoiced';

    /** @deprecated Legacy — remapped to completed_projects */
    public const STATUS_PAID = 'paid';

    public const REVIEW_PENDING = 'pending';

    public const REVIEW_ACCEPTED = 'accepted';

    public const REVIEW_REJECTED = 'rejected';

    public const STAGE_MASTERLIST = 'masterlist';

    public const STAGE_APM = 'apm';

    /**
     * Status (Archi) — from workflow_statuses (kind=archi), with PDF fallback.
     *
     * @return array<string, string>
     */
    public static function statusOptions(): array
    {
        $fromDb = WorkflowStatus::optionsForKind(WorkflowStatus::KIND_ARCHI);

        if ($fromDb !== []) {
            return $fromDb;
        }

        return [
            self::STATUS_DRAFTING_WIP => 'Drafting - Work In Progress',
            self::STATUS_DESIGN_WIP => 'Design - Work In Progress',
            self::STATUS_FOR_QUOTES => 'For Quotes',
            self::STATUS_COMPLETED_PROJECTS => 'Completed Projects',
            self::STATUS_CANCELLED_JOBS => 'Cancelled Jobs',
        ];
    }

    /**
     * Labels for dropdowns + legacy rows (pre-APM-section statuses).
     *
     * @return array<string, string>
     */
    public static function statusLabels(): array
    {
        return [
            ...self::statusOptions(),
            self::STATUS_NEW => 'For Quotes',
            self::STATUS_ASSIGNED => 'Drafting - Work In Progress',
            self::STATUS_WIP => 'Drafting - Work In Progress',
            self::STATUS_FOR_CHECKING => 'Drafting - Work In Progress',
            self::STATUS_ON_HOLD => 'Drafting - Work In Progress',
            self::STATUS_QUERY => 'Drafting - Work In Progress',
            self::STATUS_SUBMITTED => 'Completed Projects',
            self::STATUS_CANCELLED => 'Cancelled Jobs',
            self::STATUS_FOR_QUOTE => 'For Quotes',
            self::STATUS_QUOTE_SENT => 'For Quotes',
            self::STATUS_INVOICED => 'Completed Projects',
            self::STATUS_PAID => 'Completed Projects',
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
        'start_date',
        'date_out',
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
        'unit_development_count',
        'external_wall_construction_id',
        'roof_type_id',
        'ceiling_heights',
        'first_floor_slab',
        'additional_inclusions',
        'drawing_checklist',
        'archived_at',
        'review_status',
        'workflow_stage',
        'reviewed_by',
        'reviewed_at',
    ];

    /**
     * Default drawing status checklist keys shown on PROJECT INFO.
     *
     * @return list<array{key: string, label: string}>
     */
    public static function defaultDrawingChecklist(): array
    {
        return [
            ['key' => 'site_plan', 'label' => 'Site Plan'],
            ['key' => 'overall_site_plan', 'label' => 'Overall Site Plan'],
            ['key' => 'ground_floor_plan', 'label' => 'Ground Floor Plan'],
            ['key' => 'first_floor_plan', 'label' => 'First Floor Plan'],
            ['key' => 'elevations', 'label' => 'Elevations'],
            ['key' => 'sections', 'label' => 'Sections'],
            ['key' => 'details', 'label' => 'Details'],
            ['key' => 'roof_plan', 'label' => 'Roof Plan'],
            ['key' => 'stair_layout', 'label' => 'Stair Layout'],
            ['key' => 'internal_layout', 'label' => 'Internal Layout'],
            ['key' => 'electrical_plans', 'label' => 'Electrical Plans'],
            ['key' => 'slab_plumbing', 'label' => 'Slab / Plumbing'],
            ['key' => 'landscape_plan', 'label' => 'Landscape Plan'],
            ['key' => 'set_out_plan', 'label' => 'Set Out Plan'],
            ['key' => 'shadow_diagram', 'label' => 'Shadow Diagram'],
            ['key' => '3d_model', 'label' => '3D Model'],
        ];
    }

    /**
     * @return list<array{key: string, label: string, checked: bool}>
     */
    public function resolvedDrawingChecklist(): array
    {
        $saved = is_array($this->drawing_checklist) ? $this->drawing_checklist : [];
        $byKey = [];

        foreach ($saved as $item) {
            if (! is_array($item) || empty($item['key'])) {
                continue;
            }

            $byKey[(string) $item['key']] = (bool) ($item['checked'] ?? false);
        }

        return array_map(
            fn (array $item) => [
                'key' => $item['key'],
                'label' => $item['label'],
                'checked' => $byKey[$item['key']] ?? false,
            ],
            self::defaultDrawingChecklist(),
        );
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'start_date' => 'date',
            'date_out' => 'date',
            'archived_at' => 'datetime',
            'max_building_area_sqm' => 'decimal:2',
            'ndis_sda' => 'boolean',
            'is_priority' => 'boolean',
            'unit_development_count' => 'integer',
            'drawing_checklist' => 'array',
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
    public function scopeMasterlist(Builder $query): Builder
    {
        return $query->where('workflow_stage', self::STAGE_MASTERLIST);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeApm(Builder $query): Builder
    {
        return $query->where('workflow_stage', self::STAGE_APM);
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

    /**
     * @return HasMany<DraftingRequestUnit, $this>
     */
    public function units(): HasMany
    {
        return $this->hasMany(DraftingRequestUnit::class)
            ->orderBy('unit_number');
    }

    public function statusLabel(): string
    {
        if ($this->status === null || $this->status === '') {
            return self::statusOptions()[self::STATUS_FOR_QUOTES]
                ?? self::statusLabels()[self::STATUS_FOR_QUOTES]
                ?? 'For Quotes';
        }

        return self::statusLabels()[$this->status]
            ?? ucfirst(str_replace('_', ' ', $this->status));
    }
}
