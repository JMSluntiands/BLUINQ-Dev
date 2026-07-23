<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('crm_categories')) {
            return;
        }

        if (! Schema::hasColumn('crm_categories', 'code')) {
            Schema::table('crm_categories', function (Blueprint $table) {
                $table->string('code', 64)->nullable()->after('id');
            });
        }

        // Existing rows were seeded with short codes in `name`.
        DB::table('crm_categories')
            ->whereNull('code')
            ->update(['code' => DB::raw('name')]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('crm_categories')) {
            return;
        }

        if (Schema::hasColumn('crm_categories', 'code')) {
            Schema::table('crm_categories', function (Blueprint $table) {
                $table->dropColumn('code');
            });
        }
    }
};
