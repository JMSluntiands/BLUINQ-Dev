<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('drafting_requests', 'client_id')) {
                $table->foreignId('client_id')
                    ->nullable()
                    ->after('company_name')
                    ->constrained('clients')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('drafting_requests', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (! Schema::hasColumn('drafting_requests', 'council_shire')) {
                $table->string('council_shire')->nullable()->after('site_address');
            }
        });
    }

    public function down(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (Schema::hasColumn('drafting_requests', 'client_id')) {
                $table->dropConstrainedForeignId('client_id');
            }
            if (Schema::hasColumn('drafting_requests', 'phone')) {
                $table->dropColumn('phone');
            }
            if (Schema::hasColumn('drafting_requests', 'council_shire')) {
                $table->dropColumn('council_shire');
            }
        });
    }
};
