<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Permission extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'status',
        'group_key',
        'parent_slug',
        'sort_order',
    ];

    /**
     * @return list<string>
     */
    public static function slugsForRole(string $roleValue): array
    {
        return static::query()
            ->where('status', 'active')
            ->whereIn('id', function ($q) use ($roleValue) {
                $q->select('permission_id')
                    ->from('permission_role')
                    ->where('role', $roleValue);
            })
            ->orderBy('sort_order')
            ->pluck('slug')
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $slugs
     */
    public static function syncSlugsForRole(string $roleValue, array $slugs): void
    {
        $ids = static::query()->whereIn('slug', $slugs)->pluck('id');

        DB::table('permission_role')->where('role', $roleValue)->delete();

        foreach ($ids as $id) {
            DB::table('permission_role')->insert([
                'role' => $roleValue,
                'permission_id' => $id,
            ]);
        }
    }
}
