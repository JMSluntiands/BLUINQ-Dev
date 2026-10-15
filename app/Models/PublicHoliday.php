<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class PublicHoliday extends Model
{
    protected $fillable = [
        'region',
        'holiday_date',
        'name',
        'repeats_yearly',
        'user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'holiday_date' => 'date',
            'repeats_yearly' => 'boolean',
        ];
    }

    public static function occurrenceInYear(Carbon $source, int $year): ?string
    {
        $month = (int) $source->format('n');
        $day = (int) $source->format('j');

        if (! checkdate($month, $day, $year)) {
            return null;
        }

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
