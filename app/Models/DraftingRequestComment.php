<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftingRequestComment extends Model
{
    public const KIND_COMMENT = 'comment';

    public const KIND_RUN = 'run';

    protected $fillable = [
        'drafting_request_id',
        'drafting_request_revision_id',
        'user_id',
        'kind',
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
     * @return BelongsTo<DraftingRequestRevision, $this>
     */
    public function revision(): BelongsTo
    {
        return $this->belongsTo(DraftingRequestRevision::class, 'drafting_request_revision_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
