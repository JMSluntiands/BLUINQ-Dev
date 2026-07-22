<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftingRequestUnit extends Model
{
    protected $fillable = [
        'drafting_request_id',
        'unit_number',
        'house_type',
        'area_sqm',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'unit_number' => 'integer',
            'area_sqm' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<DraftingRequest, $this>
     */
    public function draftingRequest(): BelongsTo
    {
        return $this->belongsTo(DraftingRequest::class);
    }
}
