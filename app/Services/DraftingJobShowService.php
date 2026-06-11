<?php

namespace App\Services;

use App\Models\DraftingRequest;
use App\Models\DraftingRequestAccountEntry;
use App\Models\DraftingRequestRevision;

class DraftingJobShowService
{
    /**
     * @return list<array<string, mixed>>
     */
    public function revisionsFor(DraftingRequest $draftingRequest): array
    {
        return $draftingRequest->revisions()
            ->with('drafter:id,name')
            ->get()
            ->map(fn (DraftingRequestRevision $revision) => [
                'id' => $revision->id,
                'code' => $revision->code,
                'log_date' => $revision->log_date?->format('d M Y'),
                'category' => $revision->category,
                'drafter_initials' => $revision->drafter_initials
                    ?? $revision->drafter?->badgeInitials(),
                'drafter_name' => $revision->drafter?->name,
                'hours' => $revision->hours !== null
                    ? rtrim(rtrim((string) $revision->hours, '0'), '.')
                    : null,
                'submitted_date' => $revision->submitted_date?->format('d M Y'),
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function quotesFor(DraftingRequest $draftingRequest): array
    {
        return $this->accountEntriesFor($draftingRequest, DraftingRequestAccountEntry::KIND_QUOTE);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function invoicesFor(DraftingRequest $draftingRequest): array
    {
        return $this->accountEntriesFor($draftingRequest, DraftingRequestAccountEntry::KIND_INVOICE);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function accountEntriesFor(DraftingRequest $draftingRequest, string $kind): array
    {
        return $draftingRequest->accountEntries()
            ->where('kind', $kind)
            ->get()
            ->map(fn (DraftingRequestAccountEntry $entry) => [
                'id' => $entry->id,
                'number' => $entry->number,
                'category' => $entry->category,
                'rate' => $entry->rate,
                'status' => $entry->status,
            ])
            ->all();
    }

    /**
     * @return array<string, string|null>
     */
    public function integrationUrls(): array
    {
        return [
            'sharepoint' => config('drafting.sharepoint_base_url') ?: null,
            'xero_quote' => config('drafting.xero_quote_base_url') ?: null,
            'xero_invoice' => config('drafting.xero_invoice_base_url') ?: null,
        ];
    }

    public function buildingSpecifications(DraftingRequest $draftingRequest): ?string
    {
        $parts = array_filter([
            $draftingRequest->externalWallConstruction?->name
                ? 'External wall: '.$draftingRequest->externalWallConstruction->name
                : null,
            $draftingRequest->roofType?->name
                ? 'Roof: '.$draftingRequest->roofType->name
                : null,
            $draftingRequest->ceiling_heights
                ? 'Ceiling heights: '.$draftingRequest->ceiling_heights
                : null,
            $draftingRequest->first_floor_slab
                ? 'First floor slab: '.$draftingRequest->first_floor_slab
                : null,
            $draftingRequest->design_requirements,
            $draftingRequest->additional_inclusions,
        ]);

        if ($parts === []) {
            return null;
        }

        return implode("\n", $parts);
    }

    public function formattedBuildingArea(DraftingRequest $draftingRequest): ?string
    {
        if ($draftingRequest->max_building_area_sqm === null) {
            return null;
        }

        $value = rtrim(rtrim((string) $draftingRequest->max_building_area_sqm, '0'), '.');

        return $value.' SQM';
    }

    public function formattedServices(DraftingRequest $draftingRequest): ?string
    {
        $names = $draftingRequest->serviceEngagings
            ->pluck('name')
            ->map(fn (string $name) => mb_strtoupper($name))
            ->values();

        if ($names->isEmpty()) {
            return null;
        }

        return $names->join(', ');
    }
}
