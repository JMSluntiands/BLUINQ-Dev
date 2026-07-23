<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sda_types')) {
            return;
        }

        if (! Schema::hasColumn('sda_types', 'code')) {
            Schema::table('sda_types', function (Blueprint $table) {
                $table->string('code', 64)->nullable()->after('id');
            });
        }

        DB::table('sda_types')
            ->whereNull('code')
            ->update(['code' => DB::raw('name')]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('sda_types')) {
            return;
        }

        if (Schema::hasColumn('sda_types', 'code')) {
            Schema::table('sda_types', function (Blueprint $table) {
                $table->dropColumn('code');
            });
        }
    }
};
