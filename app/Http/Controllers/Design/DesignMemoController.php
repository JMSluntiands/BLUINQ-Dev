<?php

namespace App\Http\Controllers\Design;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDesignMemoRequest;
use App\Http\Requests\StoreDesignMemoTagRequest;
use App\Http\Requests\UpdateDesignMemoRequest;
use App\Models\Client;
use App\Models\DesignMemo;
use App\Models\DesignMemoTag;
use App\Models\DraftingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DesignMemoController extends Controller
{
    private const ATTACHMENT_DISK = 'local';

    public function index(Request $request): Response
    {
        [$search, $perPage, $client, $tagId, $sort] = $this->resolveFilters($request);

        $user = $request->user();
        $selectedId = $request->integer('memo') ?: null;

        $query = DesignMemo::query()
            ->with(['tags:id,name', 'user:id,name']);

        if ($client !== '') {
            $query->where('client_name', $client);
        }

        if ($tagId !== null) {
            $query->whereHas('tags', fn ($builder) => $builder->where('design_memo_tags.id', $tagId));
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('client_name', 'like', '%'.$search.'%')
                    ->orWhere('description', 'like', '%'.$search.'%')
                    ->orWhereHas('tags', fn ($tagQuery) => $tagQuery->where('name', 'like', '%'.$search.'%'));
            });
        }

        if ($sort === 'date_asc') {
            $query->orderBy('memo_date')->orderBy('id');
        } else {
            $query->orderByDesc('memo_date')->orderByDesc('id');
        }

        $memos = $query
            ->paginate($perPage)
            ->through(fn (DesignMemo $memo) => $this->formatMemo($memo))
            ->withQueryString();

        $selectedMemo = null;
        if ($selectedId !== null) {
            $fromPage = collect($memos->items())->firstWhere('id', $selectedId);
            if ($fromPage !== null) {
                $selectedMemo = $fromPage;
            } else {
                $loaded = DesignMemo::query()
                    ->with(['tags:id,name', 'user:id,name'])
                    ->find($selectedId);
                $selectedMemo = $loaded ? $this->formatMemo($loaded) : null;
            }
        }

        if ($selectedMemo === null && $memos->count() > 0) {
            $selectedMemo = $memos->items()[0];
            $selectedId = $selectedMemo['id'];
        }

        return Inertia::render('Design/Memos', [
            'memos' => $memos,
            'selectedMemo' => $selectedMemo,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'client' => $client,
                'tag_id' => $tagId,
                'sort' => $sort,
                'memo' => $selectedId,
            ],
            'clients' => $this->clientOptions(),
            'tags' => DesignMemoTag::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (DesignMemoTag $tag) => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                ])
                ->values()
                ->all(),
            'canManageMemos' => $user?->hasPermission('design-memos.manage') ?? false,
            'canManageTags' => $user?->canManageDesignMemoTags() ?? false,
        ]);
    }

    public function store(StoreDesignMemoRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $tagIds = $validated['tag_ids'] ?? [];
        unset($validated['tag_ids'], $validated['attachment']);

        $memo = DesignMemo::query()->create([
            'user_id' => $request->user()->id,
            ...$validated,
        ]);

        $memo->tags()->sync($tagIds);
        $this->storeAttachment($request, $memo);

        return redirect()
            ->route('design-memos.index', $this->redirectQuery($request))
            ->with('status', 'design-memo-created');
    }

    public function update(
        UpdateDesignMemoRequest $request,
        DesignMemo $designMemo,
    ): RedirectResponse {
        $validated = $request->validated();
        $tagIds = $validated['tag_ids'] ?? [];
        $removeAttachment = (bool) ($validated['remove_attachment'] ?? false);
        unset(
            $validated['tag_ids'],
            $validated['attachment'],
            $validated['remove_attachment'],
        );

        $designMemo->update($validated);
        $designMemo->tags()->sync($tagIds);

        if ($removeAttachment) {
            $this->deleteAttachment($designMemo);
        }

        if ($request->hasFile('attachment')) {
            $this->deleteAttachment($designMemo);
            $this->storeAttachment($request, $designMemo);
        }

        return redirect()
            ->route('design-memos.index', $this->redirectQuery($request))
            ->with('status', 'design-memo-updated');
    }

    public function destroy(Request $request, DesignMemo $designMemo): RedirectResponse
    {
        if (! $request->user()?->hasPermission('design-memos.manage')) {
            abort(403);
        }

        $this->deleteAttachment($designMemo);
        $designMemo->delete();

        return redirect()
            ->route('design-memos.index', $this->redirectQuery($request))
            ->with('status', 'design-memo-deleted');
    }

    public function downloadAttachment(DesignMemo $designMemo): StreamedResponse
    {
        if (! $designMemo->hasAttachment()) {
            abort(404);
        }

        return Storage::disk($designMemo->attachment_disk ?? self::ATTACHMENT_DISK)
            ->download(
                $designMemo->attachment_path,
                $designMemo->attachment_name ?? 'attachment.pdf',
            );
    }

    public function storeTag(StoreDesignMemoTagRequest $request): RedirectResponse|JsonResponse
    {
        $name = mb_strtoupper(trim($request->validated('name')));

        $tag = DesignMemoTag::query()->firstOrCreate(
            ['name' => $name],
            ['user_id' => $request->user()->id],
        );

        if ($request->wantsJson()) {
            return response()->json([
                'tag' => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                ],
            ]);
        }

        return redirect()
            ->route('design-memos.index', $this->redirectQuery($request))
            ->with('status', 'design-memo-tag-created');
    }

    /**
     * @return array<string, mixed>
     */
    private function formatMemo(DesignMemo $memo): array
    {
        return [
            'id' => $memo->id,
            'client_name' => $memo->client_name,
            'description' => $memo->description,
            'description_excerpt' => $this->descriptionExcerpt($memo->description),
            'reference_url' => $memo->reference_url,
            'memo_date' => $this->formatMemoDate($memo),
            'memo_date_raw' => $memo->memo_date?->format('Y-m-d'),
            'has_attachment' => $memo->hasAttachment(),
            'attachment_name' => $memo->attachment_name,
            'attachment_url' => $memo->hasAttachment()
                ? route('design-memos.attachment', $memo->id)
                : null,
            'tags' => $memo->tags
                ->map(fn (DesignMemoTag $tag) => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                ])
                ->values()
                ->all(),
            'author' => $memo->user?->name ?? '—',
        ];
    }

    private function formatMemoDate(DesignMemo $memo): string
    {
        if ($memo->memo_date === null) {
            return '—';
        }

        return strtoupper($memo->memo_date->format('d-M-y'));
    }

    private function descriptionExcerpt(?string $description): string
    {
        if ($description === null || trim(strip_tags($description)) === '') {
            return '—';
        }

        $plain = trim(preg_replace('/\s+/', ' ', strip_tags($description)) ?? '');

        return Str::limit($plain, 120);
    }

    private function storeAttachment(Request $request, DesignMemo $memo): void
    {
        if (! $request->hasFile('attachment')) {
            return;
        }

        $file = $request->file('attachment');
        $path = $file->store('design-memos/'.$memo->id, self::ATTACHMENT_DISK);

        $memo->update([
            'attachment_disk' => self::ATTACHMENT_DISK,
            'attachment_path' => $path,
            'attachment_name' => $file->getClientOriginalName(),
        ]);
    }

    private function deleteAttachment(DesignMemo $memo): void
    {
        if (! $memo->hasAttachment()) {
            return;
        }

        Storage::disk($memo->attachment_disk ?? self::ATTACHMENT_DISK)
            ->delete($memo->attachment_path);

        $memo->update([
            'attachment_disk' => null,
            'attachment_path' => null,
            'attachment_name' => null,
        ]);
    }

    /**
     * @return list<array{name: string, memo_count: int}>
     */
    private function clientOptions(): array
    {
        $fromClients = Client::query()
            ->selectable()
            ->orderBy('name')
            ->pluck('name');

        $fromJobs = DraftingRequest::query()
            ->whereNotNull('company_name')
            ->where('company_name', '!=', '')
            ->distinct()
            ->orderBy('company_name')
            ->pluck('company_name');

        $fromMemos = DesignMemo::query()
            ->whereNotNull('client_name')
            ->where('client_name', '!=', '')
            ->distinct()
            ->orderBy('client_name')
            ->pluck('client_name');

        $memoCounts = DesignMemo::query()
            ->selectRaw('client_name, count(*) as memo_count')
            ->whereNotNull('client_name')
            ->where('client_name', '!=', '')
            ->groupBy('client_name')
            ->pluck('memo_count', 'client_name');

        return $fromClients
            ->merge($fromJobs)
            ->merge($fromMemos)
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->unique(fn (string $name) => mb_strtolower($name))
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->map(function (string $name) use ($memoCounts) {
                $countKey = $memoCounts->keys()->first(
                    fn (string $key) => mb_strtolower($key) === mb_strtolower($name),
                );

                return [
                    'name' => $name,
                    'memo_count' => $countKey !== null ? (int) $memoCounts[$countKey] : 0,
                ];
            })
            ->all();
    }

    /**
     * @return array{0: string, 1: int, 2: string, 3: int|null, 4: string}
     */
    private function resolveFilters(Request $request): array
    {
        $search = Str::limit(trim((string) $request->input('search', '')), 255);
        $perPage = (int) $request->input('per_page', 20);
        if ($perPage < 5 || $perPage > 50) {
            $perPage = 20;
        }

        $client = Str::limit(trim((string) $request->input('client', '')), 255);
        $tagId = $request->integer('tag_id') ?: null;
        $sort = $request->string('sort')->toString() === 'date_asc' ? 'date_asc' : 'date_desc';

        return [$search, $perPage, $client, $tagId, $sort];
    }

    /**
     * @return array<string, mixed>
     */
    private function redirectQuery(Request $request): array
    {
        return array_filter([
            'search' => $request->input('search'),
            'per_page' => $request->input('per_page'),
            'client' => $request->input('client'),
            'tag_id' => $request->input('tag_id'),
            'sort' => $request->input('sort'),
            'memo' => $request->input('memo'),
        ], fn ($value) => $value !== null && $value !== '');
    }
}
