<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmQuoteActivity extends Model
{
    public const ACTION_QUOTE_SUBMITTED = 'quote_submitted';

    public const ACTION_COMMENT_POSTED = 'comment_posted';

    public const ACTION_RUN_COMMENT_POSTED = 'run_comment_posted';

    public const ACTION_ARCHIVED = 'archived';

    public const ACTION_RESTORED = 'restored';

    protected $fillable = [
        'crm_quote_id',
        'user_id',
        'action',
        'description',
    ];

    public function crmQuote(): BelongsTo
    {
        return $this->belongsTo(CrmQuote::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function record(
        CrmQuote $crmQuote,
        User $user,
        string $action,
        ?string $description = null,
    ): self {
        return self::query()->create([
            'crm_quote_id' => $crmQuote->id,
            'user_id' => $user->id,
            'action' => $action,
            'description' => $description,
        ]);
    }
}
