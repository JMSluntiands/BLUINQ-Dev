<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftingRequestAccountEntry extends Model
{
    public const KIND_QUOTE = 'quote';

    public const KIND_INVOICE = 'invoice';

    protected $fillable = [
        'drafting_request_id',
        'user_id',
        'kind',
        'number',
        'category',
        'rate',
        'status',
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
