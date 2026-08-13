<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DesignCatalogueItem extends Model
{
    public const RCODE_PART_B = 'part_b';

    public const RCODE_PART_C = 'part_c';

    protected $fillable = [
        'user_id',
        'client_name',
        'model_name',
        'rcode',
        'area',
        'link_url',
        'catalogue_date',
        'attachment_disk',
        'attachment_path',
        'attachment_name',
    ];

    /**
     * @return array<string, string>
     */
    public static function rcodeLabels(): array
    {
        return [
            self::RCODE_PART_B => 'Part B',
            self::RCODE_PART_C => 'Part C',
        ];
    }

    /**
     * @return list<string>
     */
    public static function rcodeValues(): array
    {
        return array_keys(self::rcodeLabels());
    }

    public function rcodeLabel(): string
    {
        return self::rcodeLabels()[$this->rcode] ?? strtoupper(str_replace('_', ' ', (string) $this->rcode));
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'catalogue_date' => 'date',
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
     * @return BelongsToMany<DesignCatalogueTag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(
            DesignCatalogueTag::class,
            'design_catalogue_item_tag',
            'design_catalogue_item_id',
            'design_catalogue_tag_id',
        )->orderBy('name');
    }

    public function hasAttachment(): bool
    {
        return $this->attachment_path !== null && $this->attachment_path !== '';
    }
}
