<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

trait HasSelectableStatus
{
    /**
     * Not archived and marked active — options for form dropdowns.
     * Pass ids already saved on a record so that value still appears while editing.
     *
     * @param  Builder<static>  $query
     * @param  mixed  $keepIds
     * @return Builder<static>
     */
    public function scopeSelectable(Builder $query, mixed $keepIds = null): Builder
    {
        $ids = array_values(array_unique(array_filter(
            is_array($keepIds) ? $keepIds : ($keepIds instanceof \Illuminate\Support\Collection ? $keepIds->all() : [$keepIds]),
            fn ($id) => $id !== null && $id !== '',
        )));

        if ($ids === []) {
            return $query->whereNull('archived_at')->where('status', 'active');
        }

        return $query->where(function (Builder $inner) use ($ids) {
            $inner->where(function (Builder $active) {
                $active->whereNull('archived_at')->where('status', 'active');
            })->orWhereIn($inner->getModel()->getQualifiedKeyName(), $ids);
        });
    }

    /**
     * Dropdown values must be active. Pass ids already saved on a record so
     * editing that record does not fail after the option is later disabled.
     */
    public static function selectableExistsRule(mixed $keepIds = null): Exists
    {
        $ids = array_values(array_filter(
            is_array($keepIds) ? $keepIds : [$keepIds],
            fn ($id) => $id !== null && $id !== '',
        ));

        return Rule::exists((new static)->getTable(), 'id')->where(
            function ($query) use ($ids) {
                $query->where(function ($allowed) use ($ids) {
                    $allowed->where(function ($active) {
                        $active->whereNull('archived_at')->where('status', 'active');
                    });

                    if ($ids !== []) {
                        $allowed->orWhereIn('id', $ids);
                    }
                });
            },
        );
    }
}
