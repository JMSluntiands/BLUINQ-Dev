<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'archived_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('archived_at')->nullable()->after('remember_token');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'archived_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('archived_at');
            });
        }
    }
};
