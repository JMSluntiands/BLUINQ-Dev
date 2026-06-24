<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DraftingMemo extends Model
{
    protected $fillable = [
        'user_id',
        'client_name',
        'description',
        'reference_url',
        'memo_date',
        'attachment_disk',
        'attachment_path',
        'attachment_name',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'memo_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsToMany<DraftingMemoTag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(
            DraftingMemoTag::class,
            'drafting_memo_tag',
            'drafting_memo_id',
            'drafting_memo_tag_id',
        )->orderBy('name');
    }

    public function hasAttachment(): bool
    {
        return $this->attachment_path !== null && $this->attachment_path !== '';
    }
}
