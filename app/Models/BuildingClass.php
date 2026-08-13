<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class BuildingClass extends Model
{
    protected $fillable = [
        'code',
        'name',
        'status',
        'archived_at',
    ];

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
     * Active options for form selects, ordered by code numerically (1a, 1b, 2, … 10a).
     *
     * @return list<array{id: int, name: string, code: string|null}>
     */
    public static function activeForSelect(): array
    {
        $rows = static::query()
            ->active()
            ->get(['id', 'name', 'code'])
            ->all();

        usort($rows, function (self $a, self $b): int {
            return self::compareCodes($a->code, $b->code)
                ?: strnatcasecmp((string) $a->name, (string) $b->name);
        });

        return array_map(
            static fn (self $row): array => [
                'id' => $row->id,
                'name' => $row->name,
                'code' => self::normalizeCode($row->code),
            ],
            $rows,
        );
    }

    /**
     * Strip a leading "Class " prefix from a building class code.
     */
    public static function normalizeCode(?string $code): ?string
    {
        if ($code === null) {
            return null;
        }

        $trimmed = trim($code);
        if ($trimmed === '') {
            return $trimmed;
        }

        return preg_replace('/^class\s+/i', '', $trimmed) ?? $trimmed;
    }

    /**
     * Code without a leading "Class " prefix (for labels).
     */
    public function displayCode(): ?string
    {
        return self::normalizeCode($this->code);
    }

    /**
     * Compare building class codes numerically (handles "1a", "Class 1a", "10b", etc.).
     */
    public static function compareCodes(?string $left, ?string $right): int
    {
        return self::codeSortKey($left) <=> self::codeSortKey($right);
    }

    /**
     * @return array{0: int, 1: string}
     */
    public static function codeSortKey(?string $code): array
    {
        $normalized = strtolower((string) self::normalizeCode($code));

        if (preg_match('/^(\d+)\s*([a-z]*)/', $normalized, $matches) === 1) {
            return [(int) $matches[1], $matches[2]];
        }

        return [PHP_INT_MAX, $normalized];
    }

    /**
     * Order by numeric portion of code, then full code (1a, 1b, 2, … 10a).
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeOrderByCodeNatural(Builder $query): Builder
    {
        // Strip optional "Class " prefix, then sort by leading digits and remainder.
        $expr = "LOWER(TRIM(REPLACE(REPLACE(code, 'Class ', ''), 'class ', '')))";

        $cast = $query->getConnection()->getDriverName() === 'sqlite'
            ? "CAST({$expr} AS INTEGER)"
            : "CAST({$expr} AS UNSIGNED)";

        return $query
            ->orderByRaw($cast)
            ->orderByRaw($expr)
            ->orderBy('name');
    }

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
        ];
    }
}
