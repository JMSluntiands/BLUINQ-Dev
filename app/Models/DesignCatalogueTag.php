<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DesignCatalogueTag extends Model
{
    public const TYPE_FRONTAGE = 'frontage';

    public const TYPE_ZONING = 'zoning';

    protected $fillable = [
        'name',
        'type',
        'user_id',
    ];

    /**
     * @return list<string>
     */
    public static function types(): array
    {
        return [
            self::TYPE_FRONTAGE,
            self::TYPE_ZONING,
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
     * @return BelongsToMany<DesignCatalogueItem, $this>
     */
    public function items(): BelongsToMany
    {
        return $this->belongsToMany(
            DesignCatalogueItem::class,
            'design_catalogue_item_tag',
            'design_catalogue_tag_id',
            'design_catalogue_item_id',
        );
    }
}
