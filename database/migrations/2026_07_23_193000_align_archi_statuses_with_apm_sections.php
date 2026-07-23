<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Align Archi workflow statuses with APM board sections:
     * Drafting WIP, Design WIP, For Quotes, Completed Projects, Cancelled Jobs.
     */
    public function up(): void
    {
        $statusMap = [
            'new' => 'for_quotes',
            'for_quote' => 'for_quotes',
            'quote_sent' => 'for_quotes',
            'assigned' => 'drafting_wip',
            'wip' => 'drafting_wip',
            'for_checking' => 'drafting_wip',
            'on_hold' => 'drafting_wip',
            'query' => 'drafting_wip',
            'drafting_wip' => 'drafting_wip',
            'design_wip' => 'design_wip',
            'submitted' => 'completed_projects',
            'invoiced' => 'completed_projects',
            'paid' => 'completed_projects',
            'cancelled' => 'cancelled_jobs',
            'cancelled_jobs' => 'cancelled_jobs',
            'for_quotes' => 'for_quotes',
            'completed_projects' => 'completed_projects',
        ];

        if (Schema::hasTable('drafting_requests')) {
            foreach ($statusMap as $from => $to) {
                if ($from === $to) {
                    continue;
                }

                DB::table('drafting_requests')
                    ->where('status', $from)
                    ->update(['status' => $to]);
            }
        }

        if (Schema::hasTable('drafting_request_revisions')) {
            foreach ($statusMap as $from => $to) {
                if ($from === $to) {
                    continue;
                }

                DB::table('drafting_request_revisions')
                    ->where('status', $from)
                    ->update(['status' => $to]);
            }
        }

        if (! Schema::hasTable('workflow_statuses')) {
            return;
        }

        $archi = [
            'drafting_wip' => 'Drafting - Work In Progress',
            'design_wip' => 'Design - Work In Progress',
            'for_quotes' => 'For Quotes',
            'completed_projects' => 'Completed Projects',
            'cancelled_jobs' => 'Cancelled Jobs',
        ];

        $now = now();

        foreach ($archi as $code => $name) {
            $existing = DB::table('workflow_statuses')
                ->where('kind', 'archi')
                ->where(function ($q) use ($code, $name) {
                    $q->where('code', $code)->orWhere('name', $name);
                })
                ->first();

            if ($existing) {
                DB::table('workflow_statuses')
                    ->where('id', $existing->id)
                    ->update([
                        'kind' => 'archi',
                        'code' => $code,
                        'name' => $name,
                        'status' => 'active',
                        'archived_at' => null,
                        'updated_at' => $now,
                    ]);

                continue;
            }

            DB::table('workflow_statuses')->insert([
                'kind' => 'archi',
                'code' => $code,
                'name' => $name,
                'status' => 'active',
                'archived_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        DB::table('workflow_statuses')
            ->where('kind', 'archi')
            ->whereNull('archived_at')
            ->whereNotIn('code', array_keys($archi))
            ->update([
                'archived_at' => $now,
                'updated_at' => $now,
            ]);
    }

    public function down(): void
    {
        // Irreversible data remap — statuses stay on the APM section codes.
    }
};
