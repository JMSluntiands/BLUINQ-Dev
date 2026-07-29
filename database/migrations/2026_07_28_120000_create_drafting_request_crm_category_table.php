<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('drafting_request_crm_category')) {
            Schema::create('drafting_request_crm_category', function (Blueprint $table) {
                $table->id();
                $table->foreignId('drafting_request_id')->constrained()->cascadeOnDelete();
                $table->foreignId('crm_category_id')->constrained('crm_categories')->cascadeOnDelete();
                $table->unique(
                    ['drafting_request_id', 'crm_category_id'],
                    'drf_crm_category_unique',
                );
            });
        }

        if (! Schema::hasColumn('drafting_requests', 'crm_category_id')) {
            return;
        }

        $rows = DB::table('drafting_requests')
            ->whereNotNull('crm_category_id')
            ->get(['id', 'crm_category_id']);

        foreach ($rows as $row) {
            $exists = DB::table('drafting_request_crm_category')
                ->where('drafting_request_id', $row->id)
                ->where('crm_category_id', $row->crm_category_id)
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('drafting_request_crm_category')->insert([
                'drafting_request_id' => $row->id,
                'crm_category_id' => $row->crm_category_id,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('drafting_request_crm_category');
    }
};
