<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'image',
        'published_at',
        'archived_at',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'image_url',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Public URL for the stored announcement image, or null.
     * Falls back to a controller route when public/storage is not linked
     * (common on shared hosts that block symlinks).
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->image) {
                return null;
            }

            $relativePath = str_replace('/', DIRECTORY_SEPARATOR, $this->image);
            $publicPath = public_path('storage'.DIRECTORY_SEPARATOR.$relativePath);

            if (is_file($publicPath)) {
                return asset('storage/'.ltrim(str_replace('\\', '/', $this->image), '/'));
            }

            $storedPath = storage_path('app/public/'.$relativePath);
            if (is_file($storedPath)) {
                return route('announcements.image', $this->id);
            }

            return null;
        });
    }
}
