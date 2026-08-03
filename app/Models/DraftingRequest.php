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

    public const STATUS_DESIGN_WIP = 'design_wip';

    public const STATUS_DRAFTING_WIP = 'drafting_wip';

    /** @deprecated Prefer STATUS_DRAFTING_WIP — kept for existing rows */
    public const STATUS_WIP = 'wip';

    public const STATUS_FOR_CHECKING = 'for_checking';

    public const STATUS_ON_HOLD = 'on_hold';

    public const STATUS_QUERY = 'query';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_FOR_QUOTE = 'for_quote';

    public const STATUS_QUOTE_SENT = 'quote_sent';

    public const STATUS_INVOICED = 'invoiced';

    public const STATUS_PAID = 'paid';

    public const REVIEW_PENDING = 'pending';

    public const REVIEW_ACCEPTED = 'accepted';

    public const REVIEW_REJECTED = 'rejected';

    public const STAGE_MASTERLIST = 'masterlist';

    public const STAGE_APM = 'apm';

    /**
     * Status (Archi) — from workflow_statuses (kind=archi), with Workflows.pdf fallback.
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
            self::STATUS_NEW => 'New',
            self::STATUS_DESIGN_WIP => 'Design WIP',
            self::STATUS_DRAFTING_WIP => 'Drafting WIP',
            self::STATUS_FOR_CHECKING => 'For Checking',
            self::STATUS_SUBMITTED => 'Submitted',
            self::STATUS_CANCELLED => 'Cancelled',
        ];
    }

    /**
     * Labels for dropdowns + legacy rows (old WIP / accounting statuses).
     *
     * @return array<string, string>
     */
    public static function statusLabels(): array
    {
        return [
            ...self::statusOptions(),
            self::STATUS_ASSIGNED => 'Assigned',
            self::STATUS_ON_HOLD => 'On Hold',
            self::STATUS_QUERY => 'Query',
            self::STATUS_WIP => 'Drafting WIP',
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
        return array_values(array_unique([
            ...array_keys(self::statusOptions()),
            self::STATUS_ASSIGNED,
            self::STATUS_ON_HOLD,
            self::STATUS_QUERY,
            self::STATUS_WIP,
        ]));
    }

    protected $fillable = [
        'user_id',
        'lead_number',
        'status',
        'is_priority',
        'vo_hours',
        'requested_at',
        'start_date',
        'eta',
        'date_out',
        'your_name',
        'company_name',
        'client_id',
        'client_contact_id',
        'email',
        'phone',
        'site_address',
        'council_shire',
        'site_owner_name',
        'max_building_area_sqm',
        'design_requirements',
        'building_type_id',
        'building_class_id',
        'storey_level_id',
        'crm_category_id',
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
            'eta' => 'date',
            'date_out' => 'date',
            'archived_at' => 'datetime',
            'max_building_area_sqm' => 'decimal:2',
            'ndis_sda' => 'boolean',
            'is_priority' => 'boolean',
            'vo_hours' => 'decimal:2',
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
        $manual = trim((string) ($this->lead_number ?? ''));

        if ($manual !== '') {
            return $manual;
        }

        $at = $this->requested_at ?? $this->created_at;

        $year = $at !== null
            ? $at->timezone(config('app.timezone'))->format('y')
            : now(config('app.timezone'))->format('y');

        return sprintf('%s%03d', $year, $this->id);
    }

    /**
     * Next revision code for this job (e.g. 26008-02).
     * Bare legacy codes equal to the job number count as -01.
     */
    public function suggestNextRevisionCode(): string
    {
        $base = $this->jobNumber();
        $maxSuffix = 0;

        $codes = $this->relationLoaded('revisions')
            ? $this->revisions->pluck('code')
            : $this->revisions()->pluck('code');

        foreach ($codes as $code) {
            $code = trim((string) $code);
            if (preg_match('/^'.preg_quote($base, '/').'-(\d{2})$/', $code, $match)) {
                $maxSuffix = max($maxSuffix, (int) $match[1]);
                continue;
            }

            if ($code === $base) {
                $maxSuffix = max($maxSuffix, 1);
            }
        }

        return sprintf('%s-%02d', $base, $maxSuffix + 1);
    }

    /**
     * Latest revision display code (always prefers NNNNN-NN; bare lead → lead-01).
     */
    public function latestRevisionCode(): ?string
    {
        $base = $this->jobNumber();
        $best = null;
        $bestSuffix = -1;

        $revisions = $this->relationLoaded('revisions')
            ? $this->revisions
            : $this->revisions()->orderByDesc('log_date')->orderByDesc('id')->get();

        foreach ($revisions as $revision) {
            $code = trim((string) ($revision->code ?? ''));
            if ($code === '') {
                continue;
            }

            if (preg_match('/^'.preg_quote($base, '/').'-(\d{2})$/', $code, $match)) {
                $suffix = (int) $match[1];
                if ($suffix > $bestSuffix) {
                    $bestSuffix = $suffix;
                    $best = $code;
                }
                continue;
            }

            if ($code === $base && $bestSuffix < 1) {
                $bestSuffix = 1;
                $best = sprintf('%s-01', $base);
            }
        }

        return $best;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Client, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * @return BelongsTo<ClientContact, $this>
     */
    public function clientContact(): BelongsTo
    {
        return $this->belongsTo(ClientContact::class);
    }

    /**
     * @return BelongsTo<CrmCategory, $this>
     */
    public function crmCategory(): BelongsTo
    {
        return $this->belongsTo(CrmCategory::class);
    }

    /**
     * @return BelongsToMany<CrmCategory, $this>
     */
    public function crmCategories(): BelongsToMany
    {
        return $this->belongsToMany(CrmCategory::class, 'drafting_request_crm_category');
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
     * @return BelongsTo<BuildingClass, $this>
     */
    public function buildingClass(): BelongsTo
    {
        return $this->belongsTo(BuildingClass::class);
    }

    /**
     * @return BelongsTo<StoreyLevel, $this>
     */
    public function storeyLevel(): BelongsTo
    {
        return $this->belongsTo(StoreyLevel::class);
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
     * @return BelongsToMany<SdaType, $this>
     */
    public function sdaTypes(): BelongsToMany
    {
        return $this->belongsToMany(SdaType::class, 'drafting_request_sda_type');
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
            return self::statusOptions()[self::STATUS_NEW] ?? 'New';
        }

        return self::statusLabels()[$this->status]
            ?? ucfirst(str_replace('_', ' ', $this->status));
    }
}
