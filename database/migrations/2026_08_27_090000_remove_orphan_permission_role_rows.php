<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('permission_role') || ! Schema::hasTable('roles')) {
            return;
        }

        $roleSlugs = DB::table('roles')->pluck('slug')->all();

        DB::table('permission_role')
            ->when(
                $roleSlugs === [],
                fn ($query) => $query->whereRaw('1 = 1'),
                fn ($query) => $query->whereNotIn('role', $roleSlugs),
            )
            ->delete();
    }

    public function down(): void
    {
        //
    }
};
