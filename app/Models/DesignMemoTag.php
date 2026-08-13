<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DesignMemoTag extends Model
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
     * @return BelongsToMany<DesignMemo, $this>
     */
    public function memos(): BelongsToMany
    {
        return $this->belongsToMany(
            DesignMemo::class,
            'design_memo_tag',
            'design_memo_tag_id',
            'design_memo_id',
        );
    }
}
