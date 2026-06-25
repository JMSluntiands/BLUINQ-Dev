<?php

namespace App\Services;

use App\Models\DraftingRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class DraftingRequestReviewService
{
    public function pendingCount(): int
    {
        return DraftingRequest::query()
            ->where('review_status', DraftingRequest::REVIEW_PENDING)
            ->count();
    }

    /**
     * @return Builder<DraftingRequest>
     */
    public function pendingQuery(): Builder
    {
        return DraftingRequest::query()
            ->with([
                'buildingType:id,name',
                'serviceEngagings:id,name',
            ])
            ->withCount('files')
            ->where('review_status', DraftingRequest::REVIEW_PENDING)
            ->orderByDesc('requested_at')
            ->orderByDesc('id');
    }

    /**
     * @return array<string, mixed>
     */
    public function formatPendingRow(DraftingRequest $request): array
    {
        return [
            'id' => $request->id,
            'reference' => sprintf('DRF-%05d', $request->id),
            'your_name' => $request->your_name,
            'company_name' => $request->company_name,
            'email' => $request->email,
            'site_address' => $request->site_address,
            'building_type' => $request->buildingType?->name,
            'services' => $request->serviceEngagings->pluck('name')->join(', '),
            'requested_at' => $request->requested_at?->timezone(config('app.timezone'))->format('M j, Y g:i A'),
            'files_count' => $request->files_count ?? 0,
        ];
    }
}
