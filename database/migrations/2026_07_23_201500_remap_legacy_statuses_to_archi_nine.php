<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remap legacy job/revision statuses onto the 9 Archi statuses from Workflows.pdf.
     */
    public function up(): void
    {
        $map = [
            'wip' => 'drafting_wip',
            'for_quote' => 'new',
            'quote_sent' => 'submitted',
            'invoiced' => 'submitted',
            'paid' => 'submitted',
            'for_quotes' => 'new',
            'completed_projects' => 'submitted',
            'cancelled_jobs' => 'cancelled',
        ];

        foreach (['drafting_requests', 'drafting_request_revisions'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            foreach ($map as $from => $to) {
                DB::table($table)
                    ->where('status', $from)
                    ->update(['status' => $to]);
            }
        }
    }

    public function down(): void
    {
        // Irreversible data remap.
    }
};
