<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_number', 50)->nullable()->after('company_name');
            $table->string('job_title')->nullable()->after('employee_number');
            $table->date('birthday')->nullable()->after('job_title');
            $table->text('personal_details')->nullable()->after('birthday');
            $table->string('personal_file_url', 2048)->nullable()->after('personal_details');
            $table->string('claims_excel_url', 2048)->nullable()->after('personal_file_url');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'employee_number',
                'job_title',
                'birthday',
                'personal_details',
                'personal_file_url',
                'claims_excel_url',
            ]);
        });
    }
};
