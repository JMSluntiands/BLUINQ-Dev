<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('workflow_statuses')) {
            return;
        }

        $now = now();
        $statuses = [
            'assigned' => 'Assigned',
            'on_hold' => 'On Hold',
            'query' => 'Query',
        ];

        foreach ($statuses as $code => $name) {
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
                        'status' => $existing->status ?: 'active',
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
    }

    public function down(): void
    {
        if (! Schema::hasTable('workflow_statuses')) {
            return;
        }

        DB::table('workflow_statuses')
            ->where('kind', 'archi')
            ->whereIn('code', ['assigned', 'on_hold', 'query'])
            ->whereNull('archived_at')
            ->update(['archived_at' => now()]);
    }
};
