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
}
