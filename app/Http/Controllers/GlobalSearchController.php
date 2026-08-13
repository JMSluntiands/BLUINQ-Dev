<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Client;
use App\Models\CrmQuote;
use App\Models\DraftingMemo;
use App\Models\DraftingRequest;
use App\Models\User;
use App\Services\DraftingRequestBoardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GlobalSearchController extends Controller
{
    private const LIMIT_PER_GROUP = 5;

    public function __construct(
        private DraftingRequestBoardService $board,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $query = Str::limit(trim((string) $request->query('q', '')), 100);

        if (mb_strlen($query) < 2) {
            return response()->json(['groups' => []]);
        }

        $user = $request->user();
        $groups = [];

        $canJobs = $user->hasPermission('job.list.view')
            || $user->hasPermission('job.drafting.view');
        $canMasterlist = $user->hasPermission('job.drafting-request.view');

        if ($canMasterlist) {
            $projects = $this->searchMasterlist($query);
            if ($projects !== []) {
                $groups[] = [
                    'type' => 'projects',
                    'label' => 'Projects',
                    'results' => $projects,
                ];
            }
        } elseif ($canJobs) {
            $jobs = $this->searchJobs($query);
            if ($jobs !== []) {
                $groups[] = [
                    'type' => 'jobs',
                    'label' => 'Jobs',
                    'results' => $jobs,
                ];
            }
        }

        if ($user->hasPermission('announcements.view')) {
            $announcements = $this->searchAnnouncements($query);
            if ($announcements !== []) {
                $groups[] = [
                    'type' => 'announcements',
                    'label' => 'Announcements',
                    'results' => $announcements,
                ];
            }
        }

        if ($user->hasPermission('settings.client.view')) {
            $clients = $this->searchClients($query);
            if ($clients !== []) {
                $groups[] = [
                    'type' => 'clients',
                    'label' => 'Clients',
                    'results' => $clients,
                ];
            }
        }

        if ($user->hasPermission('settings.user-accounts.manage')) {
            $users = $this->searchUsers($query);
            if ($users !== []) {
                $groups[] = [
                    'type' => 'users',
                    'label' => 'Users',
                    'results' => $users,
                ];
            }
        }

        if ($user->hasPermission('dashboard.view')) {
            $quotes = $this->searchQuotes($query);
            if ($quotes !== []) {
                $groups[] = [
                    'type' => 'quotes',
                    'label' => 'CRM Quotes',
                    'results' => $quotes,
                ];
            }
        }

        if ($user->hasPermission('drafting-memos.view')) {
            $memos = $this->searchMemos($query);
            if ($memos !== []) {
                $groups[] = [
                    'type' => 'memos',
                    'label' => 'Drafting Memos',
                    'results' => $memos,
                ];
            }
        }

        return response()->json(['groups' => $groups]);
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string|null, url: string}>
     */
    private function searchJobs(string $query): array
    {
        $builder = DraftingRequest::query()
            ->apm()
            ->active();

        $this->board->applySearch($builder, $query);

        return $builder
            ->orderByDesc('updated_at')
            ->limit(self::LIMIT_PER_GROUP)
            ->get()
            ->map(fn (DraftingRequest $row) => [
                'id' => $row->id,
                'title' => $row->jobNumber(),
                'subtitle' => $this->jobSubtitle($row),
                'url' => route('job.drafting.show', $row),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string|null, url: string}>
     */
    private function searchMasterlist(string $query): array
    {
        $builder = DraftingRequest::query()
            ->whereIn('workflow_stage', [
                DraftingRequest::STAGE_MASTERLIST,
                DraftingRequest::STAGE_APM,
            ])
            ->reviewAccepted()
            ->active();

        $this->board->applySearch($builder, $query);

        return $builder
            ->orderByDesc('updated_at')
            ->limit(self::LIMIT_PER_GROUP)
            ->get()
            ->map(fn (DraftingRequest $row) => [
                'id' => $row->id,
                'title' => $row->jobNumber(),
                'subtitle' => $this->jobSubtitle($row),
                'url' => $row->workflow_stage === DraftingRequest::STAGE_APM
                    ? route('job.drafting.show', $row)
                    : route('job.masterlist.show', $row),
            ])
            ->values()
            ->all();
    }

    private function jobSubtitle(DraftingRequest $row): ?string
    {
        $parts = array_filter([
            $row->statusLabel(),
            $row->company_name ?: $row->your_name,
            $row->site_address,
        ]);

        return $parts !== [] ? implode(' · ', $parts) : null;
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string|null, url: string}>
     */
    private function searchAnnouncements(string $query): array
    {
        return Announcement::query()
            ->active()
            ->with('user:id,name')
            ->where(function ($q) use ($query) {
                $q->where('title', 'like', '%'.$query.'%')
                    ->orWhere('description', 'like', '%'.$query.'%')
                    ->orWhereHas('user', fn ($userQuery) => $userQuery
                        ->where('name', 'like', '%'.$query.'%'));
            })
            ->orderByDesc('published_at')
            ->limit(self::LIMIT_PER_GROUP)
            ->get()
            ->map(fn (Announcement $row) => [
                'id' => $row->id,
                'title' => $row->title,
                'subtitle' => $row->user?->name,
                'url' => route('announcements.show', $row),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string|null, url: string}>
     */
    private function searchClients(string $query): array
    {
        return Client::query()
            ->active()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%'.$query.'%')
                    ->orWhere('abn', 'like', '%'.$query.'%')
                    ->orWhere('city', 'like', '%'.$query.'%')
                    ->orWhere('office_phone', 'like', '%'.$query.'%');
            })
            ->orderBy('name')
            ->limit(self::LIMIT_PER_GROUP)
            ->get(['id', 'name', 'city', 'abn'])
            ->map(fn (Client $row) => [
                'id' => $row->id,
                'title' => $row->name,
                'subtitle' => $row->city ?: $row->abn,
                'url' => route('settings.client.index', ['client' => $row->id]),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string|null, url: string}>
     */
    private function searchUsers(string $query): array
    {
        return User::query()
            ->active()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%'.$query.'%')
                    ->orWhere('email', 'like', '%'.$query.'%')
                    ->orWhere('initials', 'like', '%'.$query.'%');
            })
            ->orderBy('name')
            ->limit(self::LIMIT_PER_GROUP)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $row) => [
                'id' => $row->id,
                'title' => $row->name,
                'subtitle' => $row->email,
                'url' => route('settings.users.edit', $row),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string|null, url: string}>
     */
    private function searchQuotes(string $query): array
    {
        return CrmQuote::query()
            ->active()
            ->where(function ($q) use ($query) {
                $q->where('client_company_name', 'like', '%'.$query.'%')
                    ->orWhere('project_job_number', 'like', '%'.$query.'%')
                    ->orWhere('site_address', 'like', '%'.$query.'%');
            })
            ->orderByDesc('requested_at')
            ->limit(self::LIMIT_PER_GROUP)
            ->get(['id', 'client_company_name', 'project_job_number', 'site_address'])
            ->map(fn (CrmQuote $row) => [
                'id' => $row->id,
                'title' => $row->project_job_number ?: ('Quote #'.$row->id),
                'subtitle' => $row->client_company_name ?: $row->site_address,
                'url' => route('crm.quotes.show', $row),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string|null, url: string}>
     */
    private function searchMemos(string $query): array
    {
        return DraftingMemo::query()
            ->where(function ($q) use ($query) {
                $q->where('client_name', 'like', '%'.$query.'%')
                    ->orWhere('description', 'like', '%'.$query.'%');
            })
            ->orderByDesc('memo_date')
            ->limit(self::LIMIT_PER_GROUP)
            ->get(['id', 'client_name', 'description'])
            ->map(function (DraftingMemo $row) {
                $excerpt = Str::limit(trim(strip_tags((string) $row->description)), 80);

                return [
                    'id' => $row->id,
                    'title' => $row->client_name ?: ('Memo #'.$row->id),
                    'subtitle' => $excerpt !== '' ? $excerpt : null,
                    'url' => route('drafting-memos.index', array_filter([
                        'client' => $row->client_name ?: null,
                        'memo' => $row->id,
                    ])),
                ];
            })
            ->values()
            ->all();
    }
}
