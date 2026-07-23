<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class WorkflowStatus extends Model
{
    public const KIND_ARCHI = 'archi';

    public const KIND_ACCOUNTS = 'accounts';

    protected $fillable = [
        'kind',
        'code',
        'name',
        'status',
        'archived_at',
    ];

    /**
     * @return array<string, string>
     */
    public static function kindOptions(): array
    {
        return [
            self::KIND_ARCHI => 'Archi',
            self::KIND_ACCOUNTS => 'Accounts',
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

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeKind(Builder $query, string $kind): Builder
    {
        return $query->where('kind', $kind);
    }

    /**
     * Active options for a kind: [code => name]
     *
     * @return array<string, string>
     */
    public static function optionsForKind(string $kind): array
    {
        return static::query()
            ->active()
            ->where('status', 'active')
            ->kind($kind)
            ->orderBy('id')
            ->get(['code', 'name'])
            ->mapWithKeys(fn (self $row) => [
                ($row->code ?: $row->name) => $row->name,
            ])
            ->all();
    }

    /**
     * Active names for a kind (Accounts list).
     *
     * @return list<string>
     */
    public static function namesForKind(string $kind): array
    {
        return array_values(static::optionsForKind($kind));
    }

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
        ];
    }
}
