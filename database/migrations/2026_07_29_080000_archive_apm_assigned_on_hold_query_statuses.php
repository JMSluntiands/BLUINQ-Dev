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

        DB::table('workflow_statuses')
            ->where('kind', 'archi')
            ->whereIn('code', ['assigned', 'on_hold', 'query'])
            ->whereNull('archived_at')
            ->update(['archived_at' => now()]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('workflow_statuses')) {
            return;
        }

        DB::table('workflow_statuses')
            ->where('kind', 'archi')
            ->whereIn('code', ['assigned', 'on_hold', 'query'])
            ->update(['archived_at' => null]);
    }
};
