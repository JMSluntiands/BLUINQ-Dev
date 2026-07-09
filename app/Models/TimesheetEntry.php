<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TimesheetEntry extends Model
{
    public const TASK_REVISION = 'revision';

    public const TASK_ADMIN = 'admin';

    public const TASK_TRAINING = 'training';

    public const TASK_MEETING = 'meeting';

    /**
     * @var array<string, string>
     */
    public const STANDARD_TASK_LABELS = [
        self::TASK_ADMIN => 'Admin',
        self::TASK_TRAINING => 'Training',
        self::TASK_MEETING => 'Meeting',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'week_start',
        'task_type',
        'drafting_request_revision_id',
        'approval_status',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'week_start' => 'date',
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
     * @return BelongsTo<DraftingRequestRevision, $this>
     */
    public function revision(): BelongsTo
    {
        return $this->belongsTo(DraftingRequestRevision::class, 'drafting_request_revision_id');
    }

    /**
     * @return HasMany<TimesheetEntryHour, $this>
     */
    public function hours(): HasMany
    {
        return $this->hasMany(TimesheetEntryHour::class);
    }

    public function isRevisionTask(): bool
    {
        return $this->task_type === self::TASK_REVISION
            && $this->drafting_request_revision_id !== null;
    }
}
