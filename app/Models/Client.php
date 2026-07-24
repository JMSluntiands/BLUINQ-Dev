<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'name',
        'contact_name',
        'email',
        'phone',
        'status',
        'archived_at',
    ];

    /**
     * Not archived (list / archive scopes).
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Available on forms: not archived and status = active.
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeSelectable(Builder $query): Builder
    {
        return $query->whereNull('archived_at')->where('status', 'active');
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
        ];
    }
}
