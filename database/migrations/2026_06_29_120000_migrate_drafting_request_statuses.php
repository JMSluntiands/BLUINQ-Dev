<?php

use App\Models\DraftingRequest;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * @var array<string, string>
     */
    private array $jobStatusMap = [
        'allocated' => 'new',
        'pending' => 'new',
        'in_progress' => 'wip',
        'completed' => 'submitted',
        'on_hold' => 'on_hold',
    ];

    /**
     * @var array<string, string>
     */
    private array $revisionStatusMap = [
        'NEW' => 'new',
        'ASSIGNED' => 'assigned',
        'WIP' => 'wip',
        'IN_PROGRESS' => 'wip',
        'IN PROGRESS' => 'wip',
        'FOR_CHECKING' => 'for_checking',
        'FOR CHECKING' => 'for_checking',
        'SUBMITTED' => 'submitted',
        'ON_HOLD' => 'on_hold',
        'ON HOLD' => 'on_hold',
        'CANCELLED' => 'cancelled',
        'FOR_QUOTE' => 'for_quote',
        'FOR QUOTE' => 'for_quote',
        'QUOTE_SENT' => 'quote_sent',
        'QUOTE SENT' => 'quote_sent',
        'INVOICED' => 'invoiced',
        'PAID' => 'paid',
        'ALLOCATED' => 'new',
        'PENDING' => 'new',
        'COMPLETED' => 'submitted',
    ];

    public function up(): void
    {
        foreach ($this->jobStatusMap as $from => $to) {
            DB::table('drafting_requests')
                ->where('status', $from)
                ->update(['status' => $to]);
        }

        $validStatuses = DraftingRequest::statusValues();

        DB::table('drafting_request_revisions')
            ->whereNotNull('status')
            ->orderBy('id')
            ->each(function (object $row) use ($validStatuses): void {
                $raw = trim((string) $row->status);

                if ($raw === '') {
                    return;
                }

                $mapped = $this->revisionStatusMap[$raw]
                    ?? $this->revisionStatusMap[mb_strtoupper($raw)]
                    ?? null;

                if ($mapped === null) {
                    $slug = strtolower(str_replace(' ', '_', $raw));
                    $mapped = in_array($slug, $validStatuses, true) ? $slug : 'new';
                }

                if ($mapped !== $raw) {
                    DB::table('drafting_request_revisions')
                        ->where('id', $row->id)
                        ->update(['status' => $mapped]);
                }
            });
    }

    public function down(): void
    {
        $reverseJobMap = [
            'new' => 'allocated',
            'wip' => 'in_progress',
            'submitted' => 'completed',
            'on_hold' => 'on_hold',
        ];

        foreach ($reverseJobMap as $from => $to) {
            DB::table('drafting_requests')
                ->where('status', $from)
                ->update(['status' => $to]);
        }
    }
};
