<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Attendance timezone
    |--------------------------------------------------------------------------
    |
    | Used for work-day boundaries, the 9:00 AM absent cutoff, and default
    | clock display. Philippines and Singapore are both UTC+8.
    |
    */

    'timezone' => env('ATTENDANCE_TIMEZONE', 'Asia/Manila'),

    'absent_cutoff' => '09:00',

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
