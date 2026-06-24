<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDraftingMemoRequest;
use App\Http\Requests\StoreDraftingMemoTagRequest;
use App\Http\Requests\UpdateDraftingMemoRequest;
use App\Models\DraftingMemo;
use App\Models\DraftingMemoTag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DraftingMemoController extends Controller
{
    private const ATTACHMENT_DISK = 'local';

    public function index(Request $request): Response
    {
        [$search, $perPage, $client, $tagId, $sort] = $this->resolveFilters($request);

        $query = DraftingMemo::query()
            ->with(['tags:id,name', 'user:id,name'])
            ->orderByDesc('memo_date')
            ->orderByDesc('id');

        if ($client !== '') {
            $query->where('client_name', $client);
        }

        if ($tagId !== null) {
            $query->whereHas('tags', fn ($builder) => $builder->where('drafting_memo_tags.id', $tagId));
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
            $query->reorder()->orderBy('memo_date')->orderBy('id');
        }

        $user = $request->user();

        return Inertia::render('Job/DraftingMemos/Index', [
            'memos' => $query
                ->paginate($perPage)
                ->through(fn (DraftingMemo $memo) => $this->formatMemo($memo))
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'client' => $client,
                'tag_id' => $tagId,
                'sort' => $sort,
            ],
            'clients' => DraftingMemo::query()
                ->select('client_name')
                ->distinct()
                ->orderBy('client_name')
                ->pluck('client_name')
                ->values()
                ->all(),
            'tags' => DraftingMemoTag::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (DraftingMemoTag $tag) => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                ])
                ->values()
                ->all(),
            'canManageMemos' => $user?->hasPermission('drafting-memos.manage') ?? false,
            'canManageTags' => $user?->canManageDraftingMemoTags() ?? false,
        ]);
    }

    public function store(StoreDraftingMemoRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $tagIds = $validated['tag_ids'] ?? [];
        unset($validated['tag_ids'], $validated['attachment']);

        $memo = DraftingMemo::query()->create([
            'user_id' => $request->user()->id,
            ...$validated,
        ]);

        $memo->tags()->sync($tagIds);
        $this->storeAttachment($request, $memo);

        return redirect()
            ->route('drafting-memos.index', $this->redirectQuery($request))
            ->with('status', 'drafting-memo-created');
    }

    public function update(
        UpdateDraftingMemoRequest $request,
        DraftingMemo $draftingMemo,
    ): RedirectResponse {
        $validated = $request->validated();
        $tagIds = $validated['tag_ids'] ?? [];
        $removeAttachment = (bool) ($validated['remove_attachment'] ?? false);
        unset(
            $validated['tag_ids'],
            $validated['attachment'],
            $validated['remove_attachment'],
        );

        $draftingMemo->update($validated);
        $draftingMemo->tags()->sync($tagIds);

        if ($removeAttachment) {
            $this->deleteAttachment($draftingMemo);
        }

        if ($request->hasFile('attachment')) {
            $this->deleteAttachment($draftingMemo);
            $this->storeAttachment($request, $draftingMemo);
        }

        return redirect()
            ->route('drafting-memos.index', $this->redirectQuery($request))
            ->with('status', 'drafting-memo-updated');
    }

    public function destroy(Request $request, DraftingMemo $draftingMemo): RedirectResponse
    {
        if (! $request->user()?->hasPermission('drafting-memos.manage')) {
            abort(403);
        }

        $this->deleteAttachment($draftingMemo);
        $draftingMemo->delete();

        return redirect()
            ->route('drafting-memos.index', $this->redirectQuery($request))
            ->with('status', 'drafting-memo-deleted');
    }

    public function downloadAttachment(DraftingMemo $draftingMemo): StreamedResponse
    {
        if (! $draftingMemo->hasAttachment()) {
            abort(404);
        }

        return Storage::disk($draftingMemo->attachment_disk ?? self::ATTACHMENT_DISK)
            ->download(
                $draftingMemo->attachment_path,
                $draftingMemo->attachment_name ?? 'attachment.pdf',
            );
    }

    public function storeTag(StoreDraftingMemoTagRequest $request): RedirectResponse|JsonResponse
    {
        $name = mb_strtoupper(trim($request->validated('name')));

        $tag = DraftingMemoTag::query()->firstOrCreate(
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
            ->route('drafting-memos.index', $this->redirectQuery($request))
            ->with('status', 'drafting-memo-tag-created');
    }

    /**
     * @return array<string, mixed>
     */
    private function formatMemo(DraftingMemo $memo): array
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
                ? route('drafting-memos.attachment', $memo->id)
                : null,
            'tags' => $memo->tags
                ->map(fn (DraftingMemoTag $tag) => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                ])
                ->values()
                ->all(),
            'author' => $memo->user?->name ?? '—',
        ];
    }

    private function formatMemoDate(DraftingMemo $memo): string
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

    private function storeAttachment(Request $request, DraftingMemo $memo): void
    {
        if (! $request->hasFile('attachment')) {
            return;
        }

        $file = $request->file('attachment');
        $path = $file->store('drafting-memos/'.$memo->id, self::ATTACHMENT_DISK);

        $memo->update([
            'attachment_disk' => self::ATTACHMENT_DISK,
            'attachment_path' => $path,
            'attachment_name' => $file->getClientOriginalName(),
        ]);
    }

    private function deleteAttachment(DraftingMemo $memo): void
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
     * @return array{0: string, 1: int, 2: string, 3: int|null, 4: string}
     */
    private function resolveFilters(Request $request): array
    {
        $search = Str::limit(trim((string) $request->input('search', '')), 255);
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 5 || $perPage > 50) {
            $perPage = 10;
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
        ], fn ($value) => $value !== null && $value !== '');
    }
}
