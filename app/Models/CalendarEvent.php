<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarEvent extends Model
{
    public const CATEGORY_MEETING = 'meeting';

    public const CATEGORY_PARTY = 'party';

    public const CATEGORY_TEAM_SCHEDULE = 'team_schedule';

    public const CATEGORY_OTHER = 'other';

    /**
     * @var list<string>
     */
    public const CATEGORIES = [
        self::CATEGORY_MEETING,
        self::CATEGORY_PARTY,
        self::CATEGORY_TEAM_SCHEDULE,
        self::CATEGORY_OTHER,
    ];

    protected $fillable = [
        'user_id',
        'title',
        'category',
        'start_date',
        'end_date',
        'description',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categoryLabel(): string
    {
        return match ($this->category) {
            self::CATEGORY_MEETING => 'Meeting',
            self::CATEGORY_PARTY => 'Party',
            self::CATEGORY_TEAM_SCHEDULE => 'Team schedule',
            default => 'Event',
        };
    }
}
