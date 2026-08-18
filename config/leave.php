<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Employment statuses
    |--------------------------------------------------------------------------
    */
    'employment_statuses' => [
        'regular' => 'Regular',
        'probationary' => 'Probationary',
        'training' => 'Training',
    ],

    /*
    |--------------------------------------------------------------------------
    | Annual Leave (AL)
    |--------------------------------------------------------------------------
    | Default 12 days/year, +1 credit per month (pro-rated).
    | From 3rd continuous year: +1 day/year until max 20.
    | Carry over up to 7 days; must be used by end of June.
    */
    'al' => [
        'base_days' => 12,
        'max_days' => 20,
        'monthly_accrual' => 1,
        'longevity_start_year' => 3,
        'carry_over_max' => 7,
        'carry_expire_month' => 6,
        'carry_expire_day' => 30,
    ],

    /*
    |--------------------------------------------------------------------------
    | Sick Leave (SL)
    |--------------------------------------------------------------------------
    | 15 days/year, refresh every calendar year, no carry-over.
    | A medical certificate is required for more than 2 consecutive days.
    */
    'sl' => [
        'annual_days' => 15,
        'medical_certificate_after_days' => 2,
    ],

    /*
    |--------------------------------------------------------------------------
    | Hospitalization Leave (HL)
    |--------------------------------------------------------------------------
    | 60 days max per year, including SL days used.
    */
    'hl' => [
        'max_days_including_sl' => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | Leave types
    |--------------------------------------------------------------------------
    | deduct: which balance bucket is used (null = approval-only / unpaid)
    */
    'types' => [
        'al' => [
            'label' => 'Annual Leave',
            'code' => 'AL',
            'deduct' => 'al',
            'requires_entitlement' => true,
        ],
        'sl' => [
            'label' => 'Sick Leave',
            'code' => 'SL',
            'deduct' => 'sl',
            'requires_entitlement' => true,
        ],
        'hl' => [
            'label' => 'Hospitalization Leave',
            'code' => 'HL',
            'deduct' => 'hl',
            'requires_entitlement' => true,
        ],
        'cl' => [
            'label' => 'Compassionate / Bereavement Leave',
            'code' => 'CL',
            'deduct' => null,
            'requires_entitlement' => false,
        ],
        'npl' => [
            'label' => 'No Pay Leave',
            'code' => 'NPL',
            'deduct' => null,
            'requires_entitlement' => false,
        ],
        'ml' => [
            'label' => 'Maternity Leave',
            'code' => 'ML',
            'deduct' => null,
            'requires_entitlement' => false,
        ],
        'pl' => [
            'label' => 'Paternity Leave',
            'code' => 'PL',
            'deduct' => null,
            'requires_entitlement' => false,
        ],
        'tol' => [
            'label' => 'Time Off in Lieu',
            'code' => 'TOL',
            'deduct' => null,
            'requires_entitlement' => false,
        ],
    ],

    /*
    | Legacy single-pool default (kept for migration fallback).
    */
    'default_credits' => (int) env('LEAVE_DEFAULT_CREDITS', 12),
];
