<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Models\Announcement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = Announcement::query()
            ->active()
            ->with('user:id,name')
            ->orderByDesc('published_at')
            ->orderByDesc('id');

        $this->applySearch($query, $search);

        return Inertia::render('Announcements/Index', [
            'announcements' => $query
                ->paginate($perPage)
                ->through(fn (Announcement $row) => $this->formatAnnouncement($row))
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canManageAnnouncements' => $request->user()?->hasPermission('announcements.manage') ?? false,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Announcements/Create');
    }

    public function store(StoreAnnouncementRequest $request): RedirectResponse
    {
        Announcement::query()->create([
            'user_id' => $request->user()->id,
            'title' => $request->validated('title'),
            'description' => $request->sanitizedDescription(),
            'published_at' => now('UTC'),
        ]);

        return redirect()
            ->route('announcements.index')
            ->with('status', 'announcement-created');
    }

    public function edit(Request $request, Announcement $announcement): Response
    {
        if ($announcement->isArchived()) {
            abort(404);
        }

        return Inertia::render('Announcements/Edit', [
            'announcement' => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'description' => $announcement->description,
            ],
            'listFilters' => $this->redirectQuery($request),
        ]);
    }

    public function update(
        UpdateAnnouncementRequest $request,
        Announcement $announcement,
    ): RedirectResponse {
        if ($announcement->isArchived()) {
            abort(404);
        }

        $announcement->update([
            'title' => $request->validated('title'),
            'description' => $request->sanitizedDescription(),
        ]);

        return redirect()
            ->route('announcements.index', $this->redirectQuery($request))
            ->with('status', 'announcement-updated');
    }

    public function destroy(Request $request, Announcement $announcement): RedirectResponse
    {
        if ($announcement->isArchived()) {
            return redirect()
                ->route('announcements.archive', $this->redirectQuery($request))
                ->with('status', 'announcement-already-archived');
        }

        $announcement->forceFill(['archived_at' => now()])->save();

        return redirect()
            ->route('announcements.index', $this->redirectQuery($request))
            ->with('status', 'announcement-archived');
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = Announcement::query()
            ->archived()
            ->with('user:id,name')
            ->orderByDesc('archived_at');

        $this->applySearch($query, $search);

        return Inertia::render('Announcements/Archive', [
            'announcements' => $query
                ->paginate($perPage)
                ->through(fn (Announcement $row) => $this->formatAnnouncement($row, true))
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canManageAnnouncements' => $request->user()?->hasPermission('announcements.manage') ?? false,
        ]);
    }

    public function restore(Request $request, Announcement $announcement): RedirectResponse
    {
        if (! $announcement->isArchived()) {
            return redirect()
                ->route('announcements.index', $this->redirectQuery($request))
                ->with('status', 'announcement-not-archived');
        }

        $announcement->forceFill(['archived_at' => null])->save();

        return redirect()
            ->route('announcements.archive', $this->redirectQuery($request))
            ->with('status', 'announcement-restored');
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function latestForDashboard(int $limit = 4): array
    {
        return Announcement::query()
            ->active()
            ->with('user:id,name')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (Announcement $row) => (new self)->formatAnnouncement($row))
            ->values()
            ->all();
    }

    private function displayTimezone(): string
    {
        return (string) config('attendance.timezone', 'Asia/Manila');
    }

    /**
     * @return array<string, mixed>
     */
    private function formatAnnouncement(Announcement $announcement, bool $includeArchivedAt = false): array
    {
        $tz = $this->displayTimezone();
        $publishedAt = $announcement->published_at?->timezone($tz);
        $archivedAt = $announcement->archived_at?->timezone($tz);

        $data = [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'description' => $announcement->description,
            'excerpt' => Str::limit(trim(strip_tags($announcement->description)), 140),
            'published_at' => $publishedAt?->toIso8601String(),
            'date' => $publishedAt?->format('F j, Y'),
            'time' => $publishedAt?->format('g:i A'),
            'posted_at' => $publishedAt
                ? $publishedAt->format('M j, Y g:i A')
                : '—',
            'author' => $announcement->user?->name ?? 'Unknown',
        ];

        if ($includeArchivedAt) {
            $data['archived_at'] = $archivedAt?->toIso8601String();
            $data['archived_at_label'] = $archivedAt
                ? $archivedAt->format('M j, Y g:i A')
                : '—';
        }

        return $data;
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<Announcement>  $query
     */
    private function applySearch($query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $query->where(function ($q) use ($search) {
            $q->where('title', 'like', '%'.$search.'%')
                ->orWhere('description', 'like', '%'.$search.'%')
                ->orWhereHas('user', fn ($userQuery) => $userQuery
                    ->where('name', 'like', '%'.$search.'%'));
        });
    }

    /**
     * @return array{0: string, 1: int}
     */
    private function resolveListFilters(Request $request): array
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 10);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;

        return [$search, $perPage];
    }

    /**
     * @return array<string, mixed>
     */
    private function redirectQuery(Request $request): array
    {
        $query = [];
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 10);

        if ($search !== '') {
            $query['search'] = $search;
        }

        if (in_array($perPage, [10, 25, 50, 100], true) && $perPage !== 10) {
            $query['per_page'] = $perPage;
        }

        return $query;
    }
}
