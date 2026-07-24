<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('drafting_requests', 'building_class_id')) {
                $table->foreignId('building_class_id')
                    ->nullable()
                    ->after('building_type_id')
                    ->constrained('building_classes')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            if (Schema::hasColumn('drafting_requests', 'building_class_id')) {
                $table->dropConstrainedForeignId('building_class_id');
            }
        });
    }
};
