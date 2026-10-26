<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmQuoteComment extends Model
{
    public const KIND_COMMENT = 'comment';

    public const KIND_RUN = 'run';

    protected $fillable = [
        'crm_quote_id',
        'user_id',
        'kind',
        'body',
    ];

    public function crmQuote(): BelongsTo
    {
        return $this->belongsTo(CrmQuote::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function canBeManagedBy(?User $user): bool
    {
        return $user !== null && ($user->isAdmin() || $this->user_id === $user->id);
    }

    public function wasEdited(): bool
    {
        return $this->created_at !== null
            && $this->updated_at !== null
            && $this->updated_at->gt($this->created_at);
    }
}
