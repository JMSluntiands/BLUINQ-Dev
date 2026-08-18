<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->string('attachment_disk', 32)->nullable()->after('reason');
            $table->string('attachment_path', 2048)->nullable()->after('attachment_disk');
            $table->string('attachment_name', 255)->nullable()->after('attachment_path');
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['attachment_disk', 'attachment_path', 'attachment_name']);
        });
    }
};
