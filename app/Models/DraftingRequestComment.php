<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftingRequestComment extends Model
{
    protected $fillable = [
        'drafting_request_id',
        'user_id',
        'body',
    ];

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
