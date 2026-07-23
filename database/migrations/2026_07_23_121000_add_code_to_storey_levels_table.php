<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('storey_levels')) {
            return;
        }

        if (! Schema::hasColumn('storey_levels', 'code')) {
            Schema::table('storey_levels', function (Blueprint $table) {
                $table->string('code', 64)->nullable()->after('id');
            });
        }

        DB::table('storey_levels')
            ->whereNull('code')
            ->update(['code' => DB::raw('name')]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('storey_levels')) {
            return;
        }

        if (Schema::hasColumn('storey_levels', 'code')) {
            Schema::table('storey_levels', function (Blueprint $table) {
                $table->dropColumn('code');
            });
        }
    }
};
