<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftingRequestActivity extends Model
{
    public const ACTION_REQUEST_SUBMITTED = 'request_submitted';

    public const ACTION_COMMENT_POSTED = 'comment_posted';

    protected $fillable = [
        'drafting_request_id',
        'user_id',
        'action',
        'description',
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

    public static function record(
        DraftingRequest $draftingRequest,
        User $user,
        string $action,
        ?string $description = null,
    ): self {
        return self::query()->create([
            'drafting_request_id' => $draftingRequest->id,
            'user_id' => $user->id,
            'action' => $action,
            'description' => $description,
        ]);
    }
}
