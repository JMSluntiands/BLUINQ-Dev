<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Client extends Model
{
    protected $fillable = [
        'name',
        'abn',
        'office_phone',
        'website',
        'address',
        'city',
        'state',
        'post_code',
        'country',
        'status',
        'is_default',
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

    /**
     * @return HasMany<ClientContact, $this>
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(ClientContact::class)
            ->orderByRaw("CASE type WHEN 'main' THEN 0 WHEN 'account' THEN 1 ELSE 2 END")
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    /**
     * @return HasOne<ClientContact, $this>
     */
    public function mainContact(): HasOne
    {
        return $this->hasOne(ClientContact::class)->where('type', ClientContact::TYPE_MAIN);
    }

    /**
     * @return HasOne<ClientContact, $this>
     */
    public function accountContact(): HasOne
    {
        return $this->hasOne(ClientContact::class)->where('type', ClientContact::TYPE_ACCOUNT);
    }

    /**
     * @return HasMany<ClientContact, $this>
     */
    public function additionalContacts(): HasMany
    {
        return $this->hasMany(ClientContact::class)
            ->where('type', ClientContact::TYPE_ADDITIONAL)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function ensureCoreContacts(): void
    {
        if (! $this->mainContact()->exists()) {
            $this->contacts()->create([
                'type' => ClientContact::TYPE_MAIN,
                'sort_order' => 0,
            ]);
        }

        if (! $this->accountContact()->exists()) {
            $this->contacts()->create([
                'type' => ClientContact::TYPE_ACCOUNT,
                'sort_order' => 0,
            ]);
        }
    }

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
            'is_default' => 'boolean',
        ];
    }
}
