<?php

namespace App\Services;

use App\Models\DraftingRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DraftingRequestBoardService
{
    /**
     * @return Builder<DraftingRequest>
     */
    public function baseQuery(Request $request): Builder
    {
        $user = $request->user();

        $query = DraftingRequest::query()
            ->with([
                'buildingType:id,name',
                'serviceEngagings:id,name',
            ])
            ->withCount(['files', 'comments'])
            ->active()
            ->orderByDesc('is_priority')
            ->orderByDesc('requested_at')
            ->orderByDesc('id');

        if ($user !== null && ! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query;
    }

    /**
     * @param  Builder<DraftingRequest>  $query
     */
    public function applySearch(Builder $query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $query->where(function ($q) use ($search) {
            $q->where('your_name', 'like', '%'.$search.'%')
                ->orWhere('company_name', 'like', '%'.$search.'%')
                ->orWhere('email', 'like', '%'.$search.'%')
                ->orWhere('site_address', 'like', '%'.$search.'%')
                ->orWhere('site_owner_name', 'like', '%'.$search.'%');
        });
    }

    /**
     * @return array{search: string, per_page: int}
     */
    public function resolveListFilters(Request $request): array
    {
        $search = Str::limit(trim((string) $request->input('search', '')), 255);
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 5 || $perPage > 50) {
            $perPage = 10;
        }

        return [
            'search' => $search,
            'per_page' => $perPage,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function formatBoardRow(DraftingRequest $row): array
    {
        $tz = config('app.timezone');
        $services = $row->serviceEngagings->pluck('name')->values();
        $categoryFull = $services->join(', ');
        $category = $services->first() ?? '—';
        if (mb_strlen($category) > 16) {
            $category = mb_substr($category, 0, 13).'...';
        }

        $area = null;
        if ($row->max_building_area_sqm !== null && $row->max_building_area_sqm !== '') {
            $areaValue = rtrim(rtrim((string) $row->max_building_area_sqm, '0'), '.');
            $area = $areaValue.' m²';
        }

        $boardStatus = $this->mapBoardStatus($row->status);
        $drafting = $this->padStaffSlots([], 3);
        $checking = $this->padStaffSlots([], 2);

        return [
            'id' => $row->id,
            'reference' => sprintf('DRF-%05d', $row->id),
            'job' => $row->site_address ?: '—',
            'job_no' => sprintf('DRF-%05d', $row->id),
            'builder' => $row->company_name ?: ($row->your_name ?: '—'),
            'category' => $category,
            'category_full' => $categoryFull !== '' ? $categoryFull : '—',
            'house_type' => $row->buildingType?->name ?? '—',
            'date_in' => $row->requested_at?->timezone($tz)->format('M j') ?? '—',
            'eta' => '—',
            'progress_segments' => $this->buildProgressSegments($boardStatus, $drafting, $checking),
            'drafting' => $drafting,
            'checking' => $checking,
            'total_hours' => null,
            'files_count' => $row->files_count,
            'area' => $area,
            'date_out' => '—',
            'status' => $boardStatus,
            'status_label' => $this->boardStatusLabel($boardStatus, $row->statusLabel()),
            'is_priority' => (bool) $row->is_priority,
            'vo_hours' => null,
            'comments_count' => $row->comments_count ?? 0,
            'has_comments' => ($row->comments_count ?? 0) > 0,
        ];
    }

    public function mapBoardStatus(?string $status): string
    {
        return match ($status) {
            DraftingRequest::STATUS_IN_PROGRESS => 'wip',
            DraftingRequest::STATUS_COMPLETED => 'for_checking',
            DraftingRequest::STATUS_ON_HOLD => 'on_hold',
            DraftingRequest::STATUS_PENDING, DraftingRequest::STATUS_ALLOCATED => 'new',
            default => 'new',
        };
    }

    public function boardStatusLabel(string $boardStatus, string $fallback): string
    {
        return match ($boardStatus) {
            'for_checking' => 'For Checking',
            'wip' => 'WIP',
            'new' => 'New',
            'on_hold' => 'On Hold',
            default => $fallback,
        };
    }

    /**
     * @param  list<array{initials: string, hours?: string|null}>  $assignments
     * @return list<array{initials: string, hours?: string|null}|null>
     */
    public function padStaffSlots(array $assignments, int $slots): array
    {
        $padded = [];

        for ($index = 0; $index < $slots; $index++) {
            $padded[] = $assignments[$index] ?? null;
        }

        return $padded;
    }

    /**
     * @param  list<array{initials: string, hours?: string|null}|null>  $drafting
     * @param  list<array{initials: string, hours?: string|null}|null>  $checking
     * @return list<array{color: string, weight: int}>
     */
    public function buildProgressSegments(string $boardStatus, array $drafting, array $checking): array
    {
        $palette = ['#8b5cf6', '#06b6d4', '#f472b6', '#f97316', '#22c55e', '#eab308'];
        $segments = [];

        foreach ([...$drafting, ...$checking] as $index => $assignment) {
            if ($assignment === null) {
                continue;
            }

            $segments[] = [
                'color' => $palette[$index % count($palette)],
                'weight' => 1,
            ];
        }

        if ($segments !== []) {
            return $segments;
        }

        return match ($boardStatus) {
            'for_checking' => [
                ['color' => '#06b6d4', 'weight' => 3],
                ['color' => '#8b5cf6', 'weight' => 2],
            ],
            'wip' => [
                ['color' => '#f472b6', 'weight' => 2],
                ['color' => '#f97316', 'weight' => 2],
                ['color' => '#8b5cf6', 'weight' => 1],
            ],
            'on_hold' => [
                ['color' => '#8b5cf6', 'weight' => 3],
            ],
            default => [
                ['color' => '#64748b', 'weight' => 2],
                ['color' => '#475569', 'weight' => 1],
            ],
        };
    }
}
