<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Attendance timezone
    |--------------------------------------------------------------------------
    |
    | Used for work-day boundaries, the 8:00 AM absent cutoff, and default
    | clock display. Philippines and Singapore are both UTC+8.
    |
    */

    'timezone' => env('ATTENDANCE_TIMEZONE', 'Asia/Manila'),

    'absent_cutoff' => '08:00',

    /*
    | A clock-in from the previous day with no clock-out stays the active
    | shift after midnight for this many hours.
    */
    'open_shift_hours' => (int) env('ATTENDANCE_OPEN_SHIFT_HOURS', 16),

    'display_timezones' => [
        [
            'value' => 'Asia/Manila',
            'label' => 'Philippines (PHT)',
        ],
        [
            'value' => 'Asia/Singapore',
            'label' => 'Singapore (SGT)',
        ],
    ],

];
