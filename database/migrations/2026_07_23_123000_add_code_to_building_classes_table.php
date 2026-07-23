<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('building_classes')) {
            return;
        }

        if (! Schema::hasColumn('building_classes', 'code')) {
            Schema::table('building_classes', function (Blueprint $table) {
                $table->string('code', 64)->nullable()->after('id');
            });
        }

        DB::table('building_classes')
            ->whereNull('code')
            ->update(['code' => DB::raw('name')]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('building_classes')) {
            return;
        }

        if (Schema::hasColumn('building_classes', 'code')) {
            Schema::table('building_classes', function (Blueprint $table) {
                $table->dropColumn('code');
            });
        }
    }
};
