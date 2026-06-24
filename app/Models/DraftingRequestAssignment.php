<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftingRequestAssignment extends Model
{
    public const ROLE_DRAFTING = 'drafting';

    public const ROLE_CHECKING = 'checking';

    protected $fillable = [
        'drafting_request_id',
        'role',
        'slot',
        'user_id',
        'hours',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
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
}
