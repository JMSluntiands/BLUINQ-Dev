<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->string('status', 64)->nullable()->after('hours');
            $table->string('area_size', 64)->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->dropColumn(['status', 'area_size']);
        });
    }
};
