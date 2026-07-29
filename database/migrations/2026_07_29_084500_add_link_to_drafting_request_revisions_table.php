<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->string('link', 2048)->nullable()->after('code');
        });
    }

    public function down(): void
    {
        Schema::table('drafting_request_revisions', function (Blueprint $table) {
            $table->dropColumn('link');
        });
    }
};
