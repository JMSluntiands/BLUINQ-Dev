<?php

return [

    /*
    |--------------------------------------------------------------------------
    | External integrations (SharePoint, Xero)
    |--------------------------------------------------------------------------
    |
    | Base URLs used to build revision, quote, and invoice links on the job
    | drafting detail page. Leave empty to render labels without links.
    |
    */

    'sharepoint_base_url' => env('DRAFTING_SHAREPOINT_BASE_URL', ''),

    'xero_quote_base_url' => env('DRAFTING_XERO_QUOTE_BASE_URL', ''),

    'xero_invoice_base_url' => env('DRAFTING_XERO_INVOICE_BASE_URL', ''),

    'drafting_slots' => 2,

    'checking_slots' => 2,

    'board_drafting_categories' => ['DRAFTING'],

    'board_checking_categories' => ['CHECKING'],

    /*
    |--------------------------------------------------------------------------
    | Drafter leaderboard category mapping
    |--------------------------------------------------------------------------
    |
    | Maps revision category values to dashboard chart series keys.
    |
    */

    'leaderboard_category_keys' => [
        'DA/PLANNING' => 'da_planning',
        'DA PLANNING' => 'da_planning',
        'DA-PLANNING' => 'da_planning',
        'PRESTART' => 'prestart',
        'SCHEMATIC DESIGN' => 'schematic_design',
        'SCHEMATIC' => 'schematic_design',
        'SITING' => 'siting',
        'VARIATION' => 'variation',
        'WORKING DRAWINGS' => 'working_drawings',
        'WORKING DRAWING' => 'working_drawings',
        'WD' => 'working_drawings',
    ],

    /*
    |--------------------------------------------------------------------------
    | Job list section labels (sidebar Job list page)
    |--------------------------------------------------------------------------
    */

    'job_list_sections' => [
        'drafting_wip' => 'Drafting - Work In Progress',
        'design_wip' => 'Design - Work In Progress',
        'for_quotes' => 'For Quotes',
        'completed_projects' => 'Completed Projects',
        'cancelled_jobs' => 'Cancelled Jobs',
    ],

    'design_phase_service_keywords' => [
        'design',
        'schematic',
        'siting',
        'planning',
        'prestart',
    ],

    /*
    |--------------------------------------------------------------------------
    | Public drafting request form URL
    |--------------------------------------------------------------------------
    |
    | Production: set PUBLIC_FORM_DOMAIN=bluinqform.yourdomain.com so the form
    | is served at the subdomain root (https://bluinqform.yourdomain.com/).
    |
    | Local: leave PUBLIC_FORM_DOMAIN empty — the form is at /bluinqform on APP_URL.
    |
    */

    'public_form_domain' => env('PUBLIC_FORM_DOMAIN', ''),

    'public_form_path' => env('PUBLIC_FORM_PATH', 'bluinqform'),

];
