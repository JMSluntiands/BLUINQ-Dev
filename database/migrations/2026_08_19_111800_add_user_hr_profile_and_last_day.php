<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'last_day')) {
                $table->date('last_day')->nullable()->after('date_hired');
            }
        });

        if (Schema::hasTable('user_profiles')) {
            return;
        }

        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete()->unique();

            $table->string('gender', 32)->nullable();
            $table->string('nationality', 64)->nullable();
            $table->string('religion', 64)->nullable();
            $table->string('marital_status', 32)->nullable();

            $table->string('residential_unit_street')->nullable();
            $table->string('residential_barangay', 128)->nullable();
            $table->string('residential_city', 128)->nullable();
            $table->string('residential_state', 128)->nullable();
            $table->string('residential_region', 128)->nullable();
            $table->string('residential_country', 128)->nullable();
            $table->string('residential_postcode', 32)->nullable();

            $table->string('mobile_number', 64)->nullable();
            $table->string('personal_email')->nullable();

            $table->string('hometown_unit_street')->nullable();
            $table->string('hometown_barangay', 128)->nullable();
            $table->string('hometown_city', 128)->nullable();
            $table->string('hometown_state', 128)->nullable();
            $table->string('hometown_region', 128)->nullable();
            $table->string('hometown_country', 128)->nullable();
            $table->string('hometown_postcode', 32)->nullable();

            $table->string('sss_number', 64)->nullable();
            $table->string('pagibig_number', 64)->nullable();
            $table->string('philhealth_number', 64)->nullable();
            $table->string('hmo_number', 64)->nullable();
            $table->string('tin_number', 64)->nullable();
            $table->string('tax_code', 16)->nullable();

            $table->string('bank_name', 128)->nullable();
            $table->string('bank_account_number', 64)->nullable();
            $table->string('ewallet_account_number', 64)->nullable();

            $table->string('department', 128)->nullable();
            $table->string('branch', 128)->nullable();

            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_relationship', 64)->nullable();
            $table->string('emergency_contact_number', 64)->nullable();

            $table->string('spouse_name')->nullable();
            $table->string('spouse_nationality', 64)->nullable();
            $table->string('spouse_contact_number', 64)->nullable();
            $table->string('spouse_email')->nullable();
            $table->unsignedTinyInteger('number_of_children')->nullable();
            $table->string('spouse_working', 8)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'last_day')) {
                $table->dropColumn('last_day');
            }
        });
    }
};
