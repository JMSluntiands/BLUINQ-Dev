<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftingRequestRevision extends Model
{
    protected $fillable = [
        'drafting_request_id',
        'user_id',
        'code',
        'log_date',
        'category',
        'drafter_user_id',
        'drafter_initials',
        'hours',
        'submitted_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'log_date' => 'date',
            'submitted_date' => 'date',
            'hours' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<DraftingRequest, $this>
     */
    public function draftingRequest(): BelongsTo
    {
        return $this->belongsTo(DraftingRequest::class);
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
    public function drafter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'drafter_user_id');
    }
}
