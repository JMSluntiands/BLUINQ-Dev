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

];
