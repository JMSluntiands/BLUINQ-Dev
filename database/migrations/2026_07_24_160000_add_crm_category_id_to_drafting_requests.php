<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('drafting_requests', 'crm_category_id')) {
                $table->foreignId('crm_category_id')
                    ->nullable()
                    ->after('client_id')
                    ->constrained('crm_categories')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (Schema::hasColumn('drafting_requests', 'crm_category_id')) {
                $table->dropConstrainedForeignId('crm_category_id');
            }
        });
    }
};
