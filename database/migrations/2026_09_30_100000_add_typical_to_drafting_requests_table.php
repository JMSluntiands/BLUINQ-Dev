<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->boolean('is_typical')->default(false)->after('ndis_sda');
            $table->string('typical_details')->nullable()->after('is_typical');
        });
    }

    public function down(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->dropColumn(['is_typical', 'typical_details']);
        });
    }
};
