<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('drafting_requests', 'storey_level_id')) {
                $table->foreignId('storey_level_id')
                    ->nullable()
                    ->after('building_class_id')
                    ->constrained('storey_levels')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (Schema::hasColumn('drafting_requests', 'storey_level_id')) {
                $table->dropConstrainedForeignId('storey_level_id');
            }
        });
    }
};
