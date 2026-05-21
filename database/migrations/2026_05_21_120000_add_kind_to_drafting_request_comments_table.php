<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('drafting_request_comments', 'kind')) {
            Schema::table('drafting_request_comments', function (Blueprint $table) {
                $table->string('kind', 16)
                    ->default('comment')
                    ->after('user_id');
            });
        }

        Schema::table('drafting_request_comments', function (Blueprint $table) {
            $table->index(
                ['drafting_request_id', 'kind', 'created_at'],
                'drf_comments_kind_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::table('drafting_request_comments', function (Blueprint $table) {
            $table->dropIndex('drf_comments_kind_idx');
        });

        if (Schema::hasColumn('drafting_request_comments', 'kind')) {
            Schema::table('drafting_request_comments', function (Blueprint $table) {
                $table->dropColumn('kind');
            });
        }
    }
};
