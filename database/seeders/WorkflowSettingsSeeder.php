<?php

namespace Database\Seeders;

use App\Models\BuildingClass;
use App\Models\BuildingType;
use App\Models\CrmCategory;
use App\Models\Deliverable;
use App\Models\ExternalWallConstruction;
use App\Models\SdaType;
use App\Models\ServiceEngaging;
use App\Models\StoreyLevel;
use App\Models\WorkflowStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

class WorkflowSettingsSeeder extends Seeder
{
    /**
     * Encode Workflows.pdf lookups into Workflow Settings.
     */
    public function run(): void
    {
        // Category — short code in `code`, full label in `name`
        $this->seedCategories([
            '3D' => '3D Modelling',
            'SD' => 'Schematic Design',
            'SK' => 'Concept Sketch',
            'DA' => 'DA Planning Drawings',
            'WD' => 'Working / Construction Drawings',
            'Shop' => 'Shop / Detail Drawings',
            'ST' => 'Siting / Site Plan',
            'PS' => 'Prestart',
            'FX' => 'Fix-up Correction',
            'VO' => 'Variation Order',
            'FW' => 'Forward Works',
            'RW' => 'Retaining Wall/ Screenwall Layout',
            'Mkt' => 'Marketing / Sales Plan',
            'MP' => 'Master / Estate Plan',
            'ID' => 'Interior / Joinery',
            'Fit' => 'Commercial Fitouts',
            'Ext' => 'Fencing / Pool Layout',
            'DTC' => 'Deemed to Comply',
            'RFI' => 'Request for Information',
            'NatHERS' => 'Energy Rating',
            'WMP' => 'Waste Management Plan',
            'PLR' => 'Planning Report',
            'MTG' => 'Meetings / Presentations',
            'DA-L' => 'DA Application Lodgement & Liaison',
            'CDC-L' => 'CDC Application Lodgement & Liaison',
            '3DR' => '3D Rendering',
            'SUP' => 'Site Measure & Supervision',
            'CO-ORD' => 'Consultant Coordination',
            'PE' => 'Engineer Endorsement',
            'RA' => 'Architect Endorsement',
            'QTO' => 'Quantity Take-off',
            'CC' => 'Construction Certificate',
            'ASB' => 'As-Built Drawings',
            'DEM' => 'Demolition Plan',
            'BASIX' => 'BASIX Sustainability Assessment (NSW mandatory)',
            'DWS' => 'Door / Window Schedule',
        ]);

        // Same category list as Service Engaging (full names for forms)
        $this->seedNames(ServiceEngaging::class, [
            '3D Modelling',
            'Schematic Design',
            'Concept Sketch',
            'DA Planning Drawings',
            'Working / Construction Drawings',
            'Shop / Detail Drawings',
            'Siting / Site Plan',
            'Prestart',
            'Fix-up Correction',
            'Variation Order',
            'Forward Works',
            'Retaining Wall/ Screenwall Layout',
            'Marketing / Sales Plan',
            'Master / Estate Plan',
            'Interior / Joinery',
            'Commercial Fitouts',
            'Fencing / Pool Layout',
            'Deemed to Comply',
            'Request for Information',
            'NatHERS Energy Rating',
            'Waste Management Plan',
            'Planning Report',
            'Meetings / Presentations',
            'DA Application Lodgement & Liaison',
            'CDC Application Lodgement & Liaison',
            '3D Rendering',
            'Site Measure & Supervision',
            'Consultant Coordination',
            'Engineer Endorsement',
            'Architect Endorsement',
            'Quantity Take-off',
            'Construction Certificate',
            'As-Built Drawings',
            'Demolition Plan',
            'BASIX Sustainability Assessment (NSW mandatory)',
            'Door / Window Schedule',
        ]);

        $this->seedNames(BuildingType::class, [
            'Single Dwellings',
            'Grouped Dwellings',
            'Duplex',
            'Granny Flat/Ancillary Dwelling',
            'Townhouses',
            'Attached Houses',
            'Terrace Houses',
            'Apartment/Flat/Condominium',
            'Modular/Prefab Home',
            'Commercial Building',
            'Retail Unit/Fit-Out',
            'Warehouse',
            'Medical Suite',
        ]);
        $this->archiveNamesExcept(BuildingType::class, [
            'Single Dwellings',
            'Grouped Dwellings',
            'Duplex',
            'Granny Flat/Ancillary Dwelling',
            'Townhouses',
            'Attached Houses',
            'Terrace Houses',
            'Apartment/Flat/Condominium',
            'Modular/Prefab Home',
            'Commercial Building',
            'Retail Unit/Fit-Out',
            'Warehouse',
            'Medical Suite',
        ]);
        $this->remapBuildingTypeAliases([
            'Residential' => 'Single Dwellings',
            'Commercial' => 'Commercial Building',
        ]);

        // Typical Storeys & Levels — short code in `code`, full label in `name`
        $this->seedCodedLookup(StoreyLevel::class, [
            '1s' => '1 storey',
            '2s' => '2 storeys',
            '3s' => '3 storeys',
            '4s' => '4 storeys',
            '5s' => '5 storeys',
            'B1' => 'Basement',
        ]);
        $this->archiveNamesExcept(StoreyLevel::class, [
            '1 storey',
            '2 storeys',
            '3 storeys',
            '4 storeys',
            '5 storeys',
            'Basement',
        ]);

        $this->seedCodedLookup(SdaType::class, [
            'IL' => 'Improved Liveability',
            'R' => 'Robust',
            'FA' => 'Fully Accessible',
            'HPS' => 'High Physical Support',
            'N/A' => 'Not Applicable',
        ]);
        $this->archiveNamesExcept(SdaType::class, [
            'Improved Liveability',
            'Robust',
            'Fully Accessible',
            'High Physical Support',
            'Not Applicable',
        ]);

        $ewcKeep = [
            'Single-Course (1c) Brickwork',
            'Double-Course (2c) Brickwork',
            'Brick Veneer',
            'Timber Frame',
            'Steel Frame',
            'Concrete Block / Masonry',
            'Hebel / AAC Panels',
            'Structural Insulated Panels (SIP / Bondor)',
            'Pre-cast Concrete Panels',
        ];
        $this->seedNames(ExternalWallConstruction::class, $ewcKeep);
        $this->remapExternalWallAliases([
            '1c Brickwork' => 'Single-Course (1c) Brickwork',
            '2c Brickwork' => 'Double-Course (2c) Brickwork',
            'Hebel' => 'Hebel / AAC Panels',
            'Bondor' => 'Structural Insulated Panels (SIP / Bondor)',
        ]);
        $this->archiveNamesExcept(ExternalWallConstruction::class, $ewcKeep);

        $this->seedCodedLookup(BuildingClass::class, [
            'Class 1a' => 'Single dwelling or attached dwellings',
            'Class 1b' => 'Small boarding house/hostel',
            'Class 2' => 'Apartment buildings',
            'Class 3' => 'SDA / Transient Buildings',
            'Class 4' => 'Dwelling within non-residential',
            'Class 5' => 'Office buildings',
            'Class 6' => 'Retail and service buildings',
            'Class 7a' => 'Car parks',
            'Class 7b' => 'Warehouses and storage',
            'Class 8' => 'Industrial/factory',
            'Class 9a' => 'Healthcare buildings',
            'Class 9b' => 'Assembly buildings',
            'Class 9c' => 'Aged care buildings',
            'Class 10a' => 'Shed / Garage / Carport',
            'Class 10b' => 'Retainings/Pool/Ext. Structures',
            'Class 10c' => 'Private bushfire shelters',
        ]);
        $this->archiveNamesExcept(BuildingClass::class, [
            'Single dwelling or attached dwellings',
            'Small boarding house/hostel',
            'Apartment buildings',
            'SDA / Transient Buildings',
            'Dwelling within non-residential',
            'Office buildings',
            'Retail and service buildings',
            'Car parks',
            'Warehouses and storage',
            'Industrial/factory',
            'Healthcare buildings',
            'Assembly buildings',
            'Aged care buildings',
            'Shed / Garage / Carport',
            'Retainings/Pool/Ext. Structures',
            'Private bushfire shelters',
        ]);

        $deliverables = [
            'PDF',
            'DWG',
            'PLN',
            'XLSX',
            '3DS',
            'IFC',
        ];
        $this->seedNames(Deliverable::class, $deliverables);
        $this->archiveNamesExcept(Deliverable::class, $deliverables);

        $this->seedWorkflowStatuses();
        $this->normalizeAccountEntryStatuses();
    }

    private function seedWorkflowStatuses(): void
    {
        $archi = [
            'new' => 'New',
            'assigned' => 'Assigned',
            'design_wip' => 'Design WIP',
            'drafting_wip' => 'Drafting WIP',
            'for_checking' => 'For Checking',
            'on_hold' => 'On Hold',
            'query' => 'Query',
            'submitted' => 'Submitted',
            'cancelled' => 'Cancelled',
        ];

        foreach ($archi as $code => $name) {
            $this->upsertWorkflowStatus(WorkflowStatus::KIND_ARCHI, $code, $name);
        }

        $accounts = [
            'For Quote',
            'Quote Sent',
            'Quote Accepted',
            'Declined',
            'Revised',
            'Invoiced',
            'Paid',
            'Overdue',
        ];

        foreach ($accounts as $name) {
            $this->upsertWorkflowStatus(WorkflowStatus::KIND_ACCOUNTS, $name, $name);
        }

        $keepCodes = array_merge(array_keys($archi), $accounts);
        WorkflowStatus::query()
            ->whereNull('archived_at')
            ->whereNotIn('code', $keepCodes)
            ->update(['archived_at' => now()]);
    }

    private function upsertWorkflowStatus(string $kind, string $code, string $name): void
    {
        $existing = WorkflowStatus::query()
            ->where('kind', $kind)
            ->where(function ($q) use ($code, $name) {
                $q->where('code', $code)->orWhere('name', $name);
            })
            ->first();

        if ($existing) {
            $existing->forceFill([
                'kind' => $kind,
                'code' => $code,
                'name' => $name,
                'status' => $existing->status ?: 'active',
                'archived_at' => null,
            ])->save();

            return;
        }

        WorkflowStatus::query()->create([
            'kind' => $kind,
            'code' => $code,
            'name' => $name,
            'status' => 'active',
        ]);
    }

    private function normalizeAccountEntryStatuses(): void
    {
        $map = [
            'FOR QUOTE' => 'For Quote',
            'QUOTE SENT' => 'Quote Sent',
            'ACCEPTED' => 'Quote Accepted',
            'DECLINED' => 'Declined',
            'REVISED' => 'Revised',
            'INVOICED' => 'Invoiced',
            'PAID' => 'Paid',
            'OVERDUE' => 'Overdue',
        ];

        foreach ($map as $from => $to) {
            \App\Models\DraftingRequestAccountEntry::query()
                ->where('status', $from)
                ->update(['status' => $to]);
        }
    }

    /**
     * @param  array<string, string>  $categories  code => name
     */
    private function seedCategories(array $categories): void
    {
        $this->seedCodedLookup(CrmCategory::class, $categories);
    }

    /**
     * @param  class-string<Model>  $model
     * @param  array<string, string>  $items  code => name
     */
    private function seedCodedLookup(string $model, array $items): void
    {
        foreach ($items as $code => $name) {
            $existing = $model::query()
                ->where(function ($q) use ($code) {
                    $q->where('code', $code)
                        ->orWhere(function ($inner) use ($code) {
                            $inner->where(function ($byName) use ($code) {
                                $byName->whereNull('code')->where('name', $code);
                            })->orWhere('name', $code);
                        });
                })
                ->first();

            if ($existing) {
                $existing->forceFill([
                    'code' => $code,
                    'name' => $name,
                    'status' => $existing->status ?: 'active',
                    'archived_at' => null,
                ])->save();

                continue;
            }

            $model::query()->create([
                'code' => $code,
                'name' => $name,
                'status' => 'active',
            ]);
        }
    }

    /**
     * @param  class-string<Model>  $model
     * @param  list<string>  $keepNames
     */
    private function archiveNamesExcept(string $model, array $keepNames): void
    {
        $model::query()
            ->whereNull('archived_at')
            ->whereNotIn('name', $keepNames)
            ->update(['archived_at' => now()]);
    }

    /**
     * @param  array<string, string>  $aliases  old name => new name
     */
    private function remapBuildingTypeAliases(array $aliases): void
    {
        foreach ($aliases as $from => $to) {
            $fromId = BuildingType::query()->where('name', $from)->value('id');
            $toId = BuildingType::query()->where('name', $to)->value('id');

            if ($fromId === null || $toId === null) {
                continue;
            }

            \App\Models\DraftingRequest::query()
                ->where('building_type_id', $fromId)
                ->update(['building_type_id' => $toId]);
        }
    }

    /**
     * @param  array<string, string>  $aliases  old name => new name
     */
    private function remapExternalWallAliases(array $aliases): void
    {
        foreach ($aliases as $from => $to) {
            $fromId = ExternalWallConstruction::query()->where('name', $from)->value('id');
            $toId = ExternalWallConstruction::query()->where('name', $to)->value('id');

            if ($fromId === null || $toId === null) {
                continue;
            }

            \App\Models\DraftingRequest::query()
                ->where('external_wall_construction_id', $fromId)
                ->update(['external_wall_construction_id' => $toId]);
        }
    }

    /**
     * @param  class-string<Model>  $model
     * @param  list<string>  $names
     */
    private function seedNames(string $model, array $names): void
    {
        foreach ($names as $name) {
            $row = $model::query()->firstOrCreate(
                ['name' => $name],
                ['status' => 'active'],
            );

            if ($row->archived_at !== null) {
                $row->forceFill(['archived_at' => null])->save();
            }
        }
    }
}
