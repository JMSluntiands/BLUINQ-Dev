<?php

namespace App\Http\Controllers\Design;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDesignCatalogueItemRequest;
use App\Http\Requests\StoreDesignCatalogueTagRequest;
use App\Http\Requests\UpdateDesignCatalogueItemRequest;
use App\Models\Client;
use App\Models\DesignCatalogueItem;
use App\Models\DesignCatalogueTag;
use App\Models\DraftingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DesignCatalogueController extends Controller
{
    private const ATTACHMENT_DISK = 'local';

    public function index(Request $request): Response
    {
        [$search, $perPage, $client, $tagId, $sort] = $this->resolveFilters($request);

        $user = $request->user();
        $selectedId = $request->integer('item') ?: null;

        $query = DesignCatalogueItem::query()
            ->with(['tags:id,name,type', 'user:id,name']);

        if ($client !== '') {
            $query->where('client_name', $client);
        }

        if ($tagId !== null) {
            $query->whereHas(
                'tags',
                fn ($builder) => $builder->where('design_catalogue_tags.id', $tagId),
            );
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('model_name', 'like', '%'.$search.'%')
                    ->orWhere('client_name', 'like', '%'.$search.'%')
                    ->orWhere('area', 'like', '%'.$search.'%')
                    ->orWhere('link_url', 'like', '%'.$search.'%')
                    ->orWhereHas(
                        'tags',
                        fn ($tagQuery) => $tagQuery->where('name', 'like', '%'.$search.'%'),
                    );
            });
        }

        if ($sort === 'date_asc') {
            $query->orderBy('catalogue_date')->orderBy('id');
        } else {
            $query->orderByDesc('catalogue_date')->orderByDesc('id');
        }

        $items = $query
            ->paginate($perPage)
            ->through(fn (DesignCatalogueItem $item) => $this->formatItem($item))
            ->withQueryString();

        $selectedItem = null;
        if ($selectedId !== null) {
            $fromPage = collect($items->items())->firstWhere('id', $selectedId);
            if ($fromPage !== null) {
                $selectedItem = $fromPage;
            } else {
                $loaded = DesignCatalogueItem::query()
                    ->with(['tags:id,name,type', 'user:id,name'])
                    ->find($selectedId);
                $selectedItem = $loaded ? $this->formatItem($loaded) : null;
            }
        }

        if ($selectedItem === null && $items->count() > 0) {
            $selectedItem = $items->items()[0];
            $selectedId = $selectedItem['id'];
        }

        $tags = DesignCatalogueTag::query()
            ->orderBy('type')
            ->orderBy('name')
            ->get(['id', 'name', 'type'])
            ->map(fn (DesignCatalogueTag $tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'type' => $tag->type,
            ])
            ->values()
            ->all();

        return Inertia::render('Design/Catalogue', [
            'items' => $items,
            'selectedItem' => $selectedItem,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'client' => $client,
                'tag_id' => $tagId,
                'sort' => $sort,
                'item' => $selectedId,
            ],
            'clients' => $this->clientOptions(),
            'tags' => $tags,
            'rcodes' => collect(DesignCatalogueItem::rcodeLabels())
                ->map(fn (string $label, string $value) => [
                    'value' => $value,
                    'label' => $label,
                ])
                ->values()
                ->all(),
            'canManageItems' => $user?->hasPermission('design.catalogue.manage') ?? false,
            'canManageTags' => $user?->canManageDesignCatalogueTags() ?? false,
        ]);
    }

    public function store(StoreDesignCatalogueItemRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $frontageIds = $validated['frontage_tag_ids'] ?? [];
        $zoningIds = $validated['zoning_tag_ids'] ?? [];
        unset(
            $validated['frontage_tag_ids'],
            $validated['zoning_tag_ids'],
            $validated['attachment'],
        );

        $item = DesignCatalogueItem::query()->create([
            'user_id' => $request->user()->id,
            ...$validated,
            'client_name' => $this->nullableString($validated['client_name'] ?? null),
            'area' => $this->nullableString($validated['area'] ?? null),
            'link_url' => $this->nullableString($validated['link_url'] ?? null),
        ]);

        $item->tags()->sync($this->uniqueIds([...$frontageIds, ...$zoningIds]));
        $this->storeAttachment($request, $item);

        return redirect()
            ->route('design.catalogue', $this->redirectQuery($request, $item->id))
            ->with('status', 'design-catalogue-created');
    }

    public function update(
        UpdateDesignCatalogueItemRequest $request,
        DesignCatalogueItem $designCatalogueItem,
    ): RedirectResponse {
        $validated = $request->validated();
        $frontageIds = $validated['frontage_tag_ids'] ?? [];
        $zoningIds = $validated['zoning_tag_ids'] ?? [];
        unset(
            $validated['frontage_tag_ids'],
            $validated['zoning_tag_ids'],
            $validated['attachment'],
        );

        $designCatalogueItem->update([
            ...$validated,
            'client_name' => $this->nullableString($validated['client_name'] ?? null),
            'area' => $this->nullableString($validated['area'] ?? null),
            'link_url' => $this->nullableString($validated['link_url'] ?? null),
        ]);
        $designCatalogueItem->tags()->sync($this->uniqueIds([...$frontageIds, ...$zoningIds]));

        if ($request->hasFile('attachment')) {
            $this->deleteAttachment($designCatalogueItem);
            $this->storeAttachment($request, $designCatalogueItem);
        }

        return redirect()
            ->route('design.catalogue', $this->redirectQuery($request, $designCatalogueItem->id))
            ->with('status', 'design-catalogue-updated');
    }

    public function destroy(Request $request, DesignCatalogueItem $designCatalogueItem): RedirectResponse
    {
        if (! $request->user()?->hasPermission('design.catalogue.manage')) {
            abort(403);
        }

        $this->deleteAttachment($designCatalogueItem);
        $designCatalogueItem->delete();

        return redirect()
            ->route('design.catalogue', $this->redirectQuery($request))
            ->with('status', 'design-catalogue-deleted');
    }

    public function previewPdf(DesignCatalogueItem $designCatalogueItem): StreamedResponse
    {
        if (! $designCatalogueItem->hasAttachment()) {
            abort(404);
        }

        $disk = $designCatalogueItem->attachment_disk ?? self::ATTACHMENT_DISK;
        $filename = $designCatalogueItem->attachment_name ?? 'catalogue.pdf';

        return Storage::disk($disk)->response(
            $designCatalogueItem->attachment_path,
            $filename,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$filename.'"',
            ],
        );
    }

    public function storeTag(StoreDesignCatalogueTagRequest $request): RedirectResponse|JsonResponse
    {
        $name = mb_strtoupper(trim($request->validated('name')));
        $type = $request->validated('type');

        $tag = DesignCatalogueTag::query()->firstOrCreate(
            ['name' => $name, 'type' => $type],
            ['user_id' => $request->user()->id],
        );

        if ($request->wantsJson()) {
            return response()->json([
                'tag' => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'type' => $tag->type,
                ],
            ]);
        }

        return redirect()
            ->route('design.catalogue', $this->redirectQuery($request))
            ->with('status', 'design-catalogue-tag-created');
    }

    /**
     * @return array<string, mixed>
     */
    private function formatItem(DesignCatalogueItem $item): array
    {
        $frontage = $item->tags
            ->where('type', DesignCatalogueTag::TYPE_FRONTAGE)
            ->values();
        $zoning = $item->tags
            ->where('type', DesignCatalogueTag::TYPE_ZONING)
            ->values();

        return [
            'id' => $item->id,
            'client_name' => $item->client_name,
            'model_name' => $item->model_name,
            'rcode' => $item->rcode,
            'rcode_label' => $item->rcodeLabel(),
            'area' => $item->area,
            'link_url' => $item->link_url,
            'catalogue_date' => $this->formatDate($item),
            'catalogue_date_raw' => $item->catalogue_date?->format('Y-m-d'),
            'has_attachment' => $item->hasAttachment(),
            'attachment_name' => $item->attachment_name,
            'pdf_url' => $item->hasAttachment()
                ? route('design.catalogue.pdf', $item->id)
                : null,
            'frontage_tags' => $frontage->map(fn (DesignCatalogueTag $tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'type' => $tag->type,
            ])->all(),
            'zoning_tags' => $zoning->map(fn (DesignCatalogueTag $tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'type' => $tag->type,
            ])->all(),
            'designer' => $item->user?->name ?? '—',
        ];
    }

    private function formatDate(DesignCatalogueItem $item): string
    {
        if ($item->catalogue_date === null) {
            return '—';
        }

        return strtoupper($item->catalogue_date->format('d-M'));
    }

    private function storeAttachment(Request $request, DesignCatalogueItem $item): void
    {
        if (! $request->hasFile('attachment')) {
            return;
        }

        $file = $request->file('attachment');
        $path = $file->store('design-catalogue/'.$item->id, self::ATTACHMENT_DISK);

        $item->update([
            'attachment_disk' => self::ATTACHMENT_DISK,
            'attachment_path' => $path,
            'attachment_name' => $file->getClientOriginalName(),
        ]);
    }

    private function deleteAttachment(DesignCatalogueItem $item): void
    {
        if (! $item->hasAttachment()) {
            return;
        }

        Storage::disk($item->attachment_disk ?? self::ATTACHMENT_DISK)
            ->delete($item->attachment_path);

        $item->update([
            'attachment_disk' => null,
            'attachment_path' => null,
            'attachment_name' => null,
        ]);
    }

    /**
     * @return list<array{name: string, item_count: int}>
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

        $fromItems = DesignCatalogueItem::query()
            ->whereNotNull('client_name')
            ->where('client_name', '!=', '')
            ->distinct()
            ->orderBy('client_name')
            ->pluck('client_name');

        $itemCounts = DesignCatalogueItem::query()
            ->selectRaw('client_name, count(*) as item_count')
            ->whereNotNull('client_name')
            ->where('client_name', '!=', '')
            ->groupBy('client_name')
            ->pluck('item_count', 'client_name');

        return $fromClients
            ->merge($fromJobs)
            ->merge($fromItems)
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->unique(fn (string $name) => mb_strtolower($name))
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->map(function (string $name) use ($itemCounts) {
                $countKey = $itemCounts->keys()->first(
                    fn (string $key) => mb_strtolower($key) === mb_strtolower($name),
                );

                return [
                    'name' => $name,
                    'item_count' => $countKey !== null ? (int) $itemCounts[$countKey] : 0,
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
    private function redirectQuery(Request $request, ?int $itemId = null): array
    {
        return array_filter([
            'search' => $request->input('search'),
            'per_page' => $request->input('per_page'),
            'client' => $request->input('client'),
            'tag_id' => $request->input('tag_id'),
            'sort' => $request->input('sort'),
            'item' => $itemId ?? $request->input('item'),
        ], fn ($value) => $value !== null && $value !== '');
    }

    private function nullableString(mixed $value): ?string
    {
        $trimmed = trim((string) ($value ?? ''));

        return $trimmed === '' ? null : $trimmed;
    }

    /**
     * @param  list<mixed>  $ids
     * @return list<int>
     */
    private function uniqueIds(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }
}
