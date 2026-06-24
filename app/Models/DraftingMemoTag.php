<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DraftingMemoTag extends Model
{
    protected $fillable = [
        'name',
        'user_id',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsToMany<DraftingMemo, $this>
     */
    public function memos(): BelongsToMany
    {
        return $this->belongsToMany(
            DraftingMemo::class,
            'drafting_memo_tag',
            'drafting_memo_tag_id',
            'drafting_memo_id',
        );
    }
}
