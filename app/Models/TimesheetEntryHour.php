<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimesheetEntryHour extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'timesheet_entry_id',
        'work_date',
        'hours',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'work_date' => 'date',
            'hours' => 'decimal:1',
        ];
    }

    /**
     * @return BelongsTo<TimesheetEntry, $this>
     */
    public function entry(): BelongsTo
    {
        return $this->belongsTo(TimesheetEntry::class, 'timesheet_entry_id');
    }
}
