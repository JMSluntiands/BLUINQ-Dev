<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->dateTime('requested_at')->nullable()->after('user_id');
            $table->string('your_name')->nullable()->after('requested_at');
            $table->string('company_name')->nullable()->after('your_name');
            $table->string('email')->nullable()->after('company_name');
            $table->text('site_address')->nullable()->after('email');
            $table->string('site_owner_name')->nullable()->after('site_address');
            $table->decimal('max_building_area_sqm', 12, 2)->nullable()->after('site_owner_name');
            $table->text('design_requirements')->nullable()->after('max_building_area_sqm');
            $table->foreignId('building_type_id')->nullable()->after('design_requirements')
                ->constrained('building_types');
            $table->boolean('ndis_sda')->default(false)->after('building_type_id');
            $table->foreignId('external_wall_construction_id')->nullable()->after('ndis_sda')
                ->constrained('external_wall_constructions');
            $table->foreignId('roof_type_id')->nullable()->after('external_wall_construction_id')
                ->constrained('roof_types');
            $table->text('ceiling_heights')->nullable()->after('roof_type_id');
            $table->text('first_floor_slab')->nullable()->after('ceiling_heights');
            $table->text('additional_inclusions')->nullable()->after('first_floor_slab');
        });

        Schema::create('drafting_request_service_engaging', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drafting_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_engaging_id')->constrained()->cascadeOnDelete();
            $table->unique(
                ['drafting_request_id', 'service_engaging_id'],
                'drf_service_engaging_unique',
            );
        });

        Schema::create('drafting_request_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drafting_request_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 32);
            $table->string('disk', 32)->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();

            $table->index(['drafting_request_id', 'kind']);
        });

        if (Schema::hasColumn('drafting_requests', 'payload')) {
            foreach (DB::table('drafting_requests')->orderBy('id')->get() as $row) {
                $payload = json_decode($row->payload ?? '[]', true);
                if (! is_array($payload)) {
                    continue;
                }

                DB::table('drafting_requests')->where('id', $row->id)->update([
                    'requested_at' => $payload['requested_at'] ?? null,
                    'your_name' => $payload['your_name'] ?? null,
                    'company_name' => $payload['company_name'] ?? null,
                    'email' => $payload['email'] ?? null,
                    'site_address' => $payload['site_address'] ?? null,
                    'site_owner_name' => $payload['site_owner_name'] ?? null,
                    'max_building_area_sqm' => $payload['max_building_area_sqm'] ?: null,
                    'design_requirements' => $payload['design_requirements'] ?? null,
                    'building_type_id' => $payload['building_type_id'] ?? null,
                    'ndis_sda' => (bool) ($payload['ndis_sda'] ?? false),
                    'external_wall_construction_id' => $payload['external_wall_construction_id'] ?? null,
                    'roof_type_id' => $payload['roof_type_id'] ?? null,
                    'ceiling_heights' => $payload['ceiling_heights'] ?? null,
                    'first_floor_slab' => $payload['first_floor_slab'] ?? null,
                    'additional_inclusions' => $payload['additional_inclusions'] ?? null,
                ]);

                foreach ($payload['service_engaging_ids'] ?? [] as $serviceEngagingId) {
                    if (! $serviceEngagingId) {
                        continue;
                    }

                    DB::table('drafting_request_service_engaging')->insertOrIgnore([
                        'drafting_request_id' => $row->id,
                        'service_engaging_id' => $serviceEngagingId,
                    ]);
                }

                if (! empty($payload['facade_path'])) {
                    DB::table('drafting_request_files')->insert([
                        'drafting_request_id' => $row->id,
                        'kind' => 'facade',
                        'disk' => 'public',
                        'path' => $payload['facade_path'],
                        'original_name' => basename($payload['facade_path']),
                        'mime_type' => null,
                        'size' => 0,
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]);
                }

                foreach ($payload['document_paths'] ?? [] as $documentPath) {
                    if (! is_string($documentPath) || $documentPath === '') {
                        continue;
                    }

                    DB::table('drafting_request_files')->insert([
                        'drafting_request_id' => $row->id,
                        'kind' => 'document',
                        'disk' => 'public',
                        'path' => $documentPath,
                        'original_name' => basename($documentPath),
                        'mime_type' => null,
                        'size' => 0,
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]);
                }
            }

            Schema::table('drafting_requests', function (Blueprint $table) {
                $table->dropColumn('payload');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('drafting_request_files');
        Schema::dropIfExists('drafting_request_service_engaging');

        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->json('payload')->nullable();
        });

        Schema::table('drafting_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('building_type_id');
            $table->dropConstrainedForeignId('external_wall_construction_id');
            $table->dropConstrainedForeignId('roof_type_id');
            $table->dropColumn([
                'requested_at',
                'your_name',
                'company_name',
                'email',
                'site_address',
                'site_owner_name',
                'max_building_area_sqm',
                'design_requirements',
                'ndis_sda',
                'ceiling_heights',
                'first_floor_slab',
                'additional_inclusions',
            ]);
        });
    }
};
