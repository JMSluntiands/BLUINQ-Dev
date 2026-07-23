<?php

namespace Database\Seeders;

use App\Models\BuildingType;
use App\Models\DraftingRequest;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\ServiceEngaging;
use App\Models\User;
use Illuminate\Database\Seeder;

class DraftingRequestSeeder extends Seeder
{
    /**
     * Seed sample drafting requests for the job board.
     */
    public function run(): void
    {
        $userId = User::query()->where('email', 'admin@bluinq.local')->value('id')
            ?? User::query()->value('id');

        $residentialId = BuildingType::query()->where('name', 'Single Dwellings')->value('id')
            ?? BuildingType::query()->value('id');
        $commercialId = BuildingType::query()->where('name', 'Commercial Building')->value('id')
            ?? $residentialId;

        if ($residentialId === null) {
            return;
        }

        $workingDrawingId = ServiceEngaging::query()->firstOrCreate(
            ['name' => 'Working Drawings'],
            ['status' => 'active'],
        )->id;
        $conceptId = ServiceEngaging::query()->firstOrCreate(
            ['name' => 'Concept Design'],
            ['status' => 'active'],
        )->id;
        $townPlanningId = ServiceEngaging::query()->firstOrCreate(
            ['name' => 'Town Planning'],
            ['status' => 'active'],
        )->id;

        $brickVeneerId = ExternalWallConstruction::query()->firstOrCreate(
            ['name' => 'Brick Veneer'],
            ['status' => 'active'],
        )->id;
        $hebelId = ExternalWallConstruction::query()->firstOrCreate(
            ['name' => 'Hebel / AAC Panels'],
            ['status' => 'active'],
        )->id;

        $colorbondId = RoofType::query()->firstOrCreate(
            ['name' => 'Colorbond'],
            ['status' => 'active'],
        )->id;
        $tileId = RoofType::query()->firstOrCreate(
            ['name' => 'Concrete Tile'],
            ['status' => 'active'],
        )->id;

        $samples = [
            [
                'email_key' => 'sample.alpha@example.com',
                'status' => DraftingRequest::STATUS_NEW,
                'is_priority' => true,
                'requested_at' => now()->subDays(1),
                'your_name' => 'Alex Rivera',
                'company_name' => 'Rivera Homes',
                'email' => 'sample.alpha@example.com',
                'site_address' => '12 Maple Street, Brisbane QLD 4000',
                'site_owner_name' => 'Alex Rivera',
                'max_building_area_sqm' => 220,
                'design_requirements' => 'Open-plan living with north-facing courtyard.',
                'building_type_id' => $residentialId,
                'zoning' => 'R1',
                'ndis_sda' => false,
                'external_wall_construction_id' => $brickVeneerId,
                'roof_type_id' => $colorbondId,
                'ceiling_heights' => '2700mm ground floor',
                'first_floor_slab' => 'N/A',
                'additional_inclusions' => 'Outdoor kitchen niche',
                'service_ids' => [$workingDrawingId, $conceptId],
            ],
            [
                'email_key' => 'sample.bravo@example.com',
                'status' => DraftingRequest::STATUS_DRAFTING_WIP,
                'is_priority' => false,
                'requested_at' => now()->subDays(4),
                'your_name' => 'Jordan Lee',
                'company_name' => 'Lee Constructions',
                'email' => 'sample.bravo@example.com',
                'site_address' => '88 Harbour Road, Gold Coast QLD 4217',
                'site_owner_name' => 'Sam Nguyen',
                'max_building_area_sqm' => 380,
                'design_requirements' => 'Two-storey duplex with shared party wall.',
                'building_type_id' => $residentialId,
                'zoning' => 'R3',
                'ndis_sda' => false,
                'external_wall_construction_id' => $hebelId,
                'roof_type_id' => $tileId,
                'ceiling_heights' => '2700mm GF / 2400mm FF',
                'first_floor_slab' => 'Suspended concrete slab',
                'additional_inclusions' => 'Separate meter boxes',
                'service_ids' => [$workingDrawingId],
            ],
            [
                'email_key' => 'sample.charlie@example.com',
                'status' => DraftingRequest::STATUS_DRAFTING_WIP,
                'is_priority' => true,
                'requested_at' => now()->subDays(8),
                'your_name' => 'Casey Morgan',
                'company_name' => 'Morgan Developments',
                'email' => 'sample.charlie@example.com',
                'site_address' => '5 Industrial Ave, Logan QLD 4114',
                'site_owner_name' => 'Morgan Developments',
                'max_building_area_sqm' => 650,
                'design_requirements' => 'Retail shell with rear warehouse storage.',
                'building_type_id' => $commercialId,
                'zoning' => 'Centre',
                'ndis_sda' => false,
                'external_wall_construction_id' => $brickVeneerId,
                'roof_type_id' => $colorbondId,
                'ceiling_heights' => '3600mm warehouse / 3000mm retail',
                'first_floor_slab' => 'N/A',
                'additional_inclusions' => 'Loading dock canopy',
                'service_ids' => [$workingDrawingId, $townPlanningId],
            ],
            [
                'email_key' => 'sample.delta@example.com',
                'status' => DraftingRequest::STATUS_DESIGN_WIP,
                'is_priority' => false,
                'requested_at' => now()->subDays(12),
                'your_name' => 'Taylor Brooks',
                'company_name' => 'Brooks Living',
                'email' => 'sample.delta@example.com',
                'site_address' => '44 Palm Court, Sunshine Coast QLD 4558',
                'site_owner_name' => 'Taylor Brooks',
                'max_building_area_sqm' => 165,
                'design_requirements' => 'SDA-ready accessible single dwelling.',
                'building_type_id' => $residentialId,
                'zoning' => 'R2',
                'ndis_sda' => true,
                'external_wall_construction_id' => $hebelId,
                'roof_type_id' => $colorbondId,
                'ceiling_heights' => '2700mm throughout',
                'first_floor_slab' => 'N/A',
                'additional_inclusions' => 'Compliant bathroom and wide corridors',
                'service_ids' => [$conceptId, $workingDrawingId],
            ],
            [
                'email_key' => 'sample.echo@example.com',
                'status' => DraftingRequest::STATUS_DESIGN_WIP,
                'is_priority' => false,
                'requested_at' => now()->subDays(2),
                'your_name' => 'Riley Chen',
                'company_name' => 'Chen Property Group',
                'email' => 'sample.echo@example.com',
                'site_address' => '19 Creek Lane, Ipswich QLD 4305',
                'site_owner_name' => 'Riley Chen',
                'max_building_area_sqm' => 290,
                'design_requirements' => 'Secondary dwelling + carport behind existing house.',
                'building_type_id' => $residentialId,
                'zoning' => 'R1',
                'ndis_sda' => false,
                'external_wall_construction_id' => $brickVeneerId,
                'roof_type_id' => $tileId,
                'ceiling_heights' => '2550mm',
                'first_floor_slab' => 'N/A',
                'additional_inclusions' => 'Privacy screens to neighbours',
                'service_ids' => [$townPlanningId, $workingDrawingId],
            ],
        ];

        foreach ($samples as $sample) {
            $serviceIds = $sample['service_ids'];
            unset($sample['service_ids'], $sample['email_key']);

            $request = DraftingRequest::query()->updateOrCreate(
                ['email' => $sample['email']],
                [
                    ...$sample,
                    'user_id' => $userId,
                    'review_status' => DraftingRequest::REVIEW_ACCEPTED,
                    'workflow_stage' => DraftingRequest::STAGE_APM,
                    'reviewed_by' => $userId,
                    'reviewed_at' => now()->subHours(2),
                    'archived_at' => null,
                ],
            );

            $request->serviceEngagings()->sync($serviceIds);
        }
    }
}
