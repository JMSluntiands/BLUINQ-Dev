<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDraftingRequestCommentRequest;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestComment;
use App\Models\DraftingRequestFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DraftingController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);
        $user = $request->user();

        $query = DraftingRequest::query()
            ->with([
                'buildingType:id,name',
                'serviceEngagings:id,name',
            ])
            ->withCount('files')
            ->orderByDesc('requested_at')
            ->orderByDesc('id');

        if (! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('your_name', 'like', '%'.$search.'%')
                    ->orWhere('company_name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('site_address', 'like', '%'.$search.'%')
                    ->orWhere('site_owner_name', 'like', '%'.$search.'%');
            });
        }

        return Inertia::render('Job/Drafting', [
            'draftingRequests' => $query
                ->paginate($perPage)
                ->through(fn (DraftingRequest $row) => [
                    'id' => $row->id,
                    'reference' => sprintf('DRF-%05d', $row->id),
                    'requested_at' => $row->requested_at?->timezone(config('app.timezone'))->format('d M Y, h:i A'),
                    'your_name' => $row->your_name,
                    'company_name' => $row->company_name,
                    'site_address' => $row->site_address,
                    'building_type' => $row->buildingType?->name,
                    'services' => $row->serviceEngagings->pluck('name')->join(', '),
                    'files_count' => $row->files_count,
                    'ndis_sda' => $row->ndis_sda,
                    'status' => 'pending',
                    'status_label' => 'Pending',
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canViewAllRequests' => $user->isAdmin(),
        ]);
    }

    public function show(Request $request, DraftingRequest $draftingRequest): Response
    {
        $this->authorizeView($request, $draftingRequest);

        $draftingRequest->load([
            'buildingType:id,name',
            'externalWallConstruction:id,name',
            'roofType:id,name',
            'serviceEngagings:id,name',
            'files' => fn ($query) => $query->orderBy('kind')->orderBy('id'),
            'user:id,name,email',
            'comments' => fn ($query) => $query
                ->with('user:id,name,profile_image')
                ->orderBy('created_at'),
        ]);

        $tz = config('app.timezone');

        return Inertia::render('Job/Drafting/Show', [
            'draftingRequest' => [
                'id' => $draftingRequest->id,
                'reference' => sprintf('DRF-%05d', $draftingRequest->id),
                'status_label' => 'Pending',
                'requested_at' => $draftingRequest->requested_at?->timezone($tz)->format('d M Y, h:i A'),
                'submitted_at' => $draftingRequest->created_at?->timezone($tz)->format('d M Y, h:i A'),
                'your_name' => $draftingRequest->your_name,
                'company_name' => $draftingRequest->company_name,
                'email' => $draftingRequest->email,
                'site_address' => $draftingRequest->site_address,
                'site_owner_name' => $draftingRequest->site_owner_name,
                'max_building_area_sqm' => $draftingRequest->max_building_area_sqm !== null
                    ? (string) $draftingRequest->max_building_area_sqm
                    : null,
                'design_requirements' => $draftingRequest->design_requirements,
                'building_type' => $draftingRequest->buildingType?->name,
                'ndis_sda' => $draftingRequest->ndis_sda,
                'external_wall_construction' => $draftingRequest->externalWallConstruction?->name,
                'roof_type' => $draftingRequest->roofType?->name,
                'ceiling_heights' => $draftingRequest->ceiling_heights,
                'first_floor_slab' => $draftingRequest->first_floor_slab,
                'additional_inclusions' => $draftingRequest->additional_inclusions,
                'service_engagings' => $draftingRequest->serviceEngagings
                    ->pluck('name')
                    ->values()
                    ->all(),
                'submitted_by' => $draftingRequest->user?->name,
                'files' => $draftingRequest->files->map(fn (DraftingRequestFile $file) => [
                    'id' => $file->id,
                    'kind' => $file->kind,
                    'kind_label' => $file->kind === DraftingRequestFile::KIND_FACADE
                        ? 'Facade'
                        : 'Document',
                    'original_name' => $file->original_name,
                    'mime_type' => $file->mime_type,
                    'size' => $file->size,
                    'size_label' => $this->formatFileSize($file->size),
                    'download_url' => route('job.drafting.files.download', [
                        'draftingRequest' => $draftingRequest->id,
                        'file' => $file->id,
                    ]),
                ])->all(),
                'comments' => $draftingRequest->comments
                    ->map(fn (DraftingRequestComment $comment) => $this->formatComment($comment, $tz))
                    ->all(),
                'activities' => $this->formatActivities($draftingRequest, $tz),
            ],
            'listFilters' => $this->listFiltersFromRequest($request),
        ]);
    }

    public function storeComment(
        StoreDraftingRequestCommentRequest $request,
        DraftingRequest $draftingRequest,
    ): RedirectResponse {
        $this->authorizeView($request, $draftingRequest);

        $body = $request->sanitizedBody();

        DraftingRequestComment::query()->create([
            'drafting_request_id' => $draftingRequest->id,
            'user_id' => $request->user()->id,
            'body' => $body,
        ]);

        DraftingRequestActivity::record(
            $draftingRequest,
            $request->user(),
            DraftingRequestActivity::ACTION_COMMENT_POSTED,
            $this->commentActivityDescription($body),
        );

        return redirect()
            ->route('job.drafting.show', [
                'draftingRequest' => $draftingRequest->id,
                ...array_filter($this->listFiltersFromRequest($request)),
            ])
            ->with('status', 'comment-added');
    }

    public function downloadFile(
        Request $request,
        DraftingRequest $draftingRequest,
        DraftingRequestFile $file,
    ): StreamedResponse {
        $this->authorizeView($request, $draftingRequest);

        if ($file->drafting_request_id !== $draftingRequest->id) {
            abort(404);
        }

        if (! Storage::disk($file->disk)->exists($file->path)) {
            abort(404);
        }

        return Storage::disk($file->disk)->download(
            $file->path,
            $file->original_name,
        );
    }

    private function authorizeView(Request $request, DraftingRequest $draftingRequest): void
    {
        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        if (! $user->isAdmin() && $draftingRequest->user_id !== $user->id) {
            abort(403);
        }
    }

    /**
     * @return array{search: string, per_page: int|null}
     */
    private function listFiltersFromRequest(Request $request): array
    {
        $perPage = $request->query('per_page');

        return [
            'search' => Str::limit(trim((string) $request->query('search', '')), 255),
            'per_page' => $perPage !== null && $perPage !== ''
                ? (int) $perPage
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatComment(DraftingRequestComment $comment, string $tz): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'author_name' => $comment->user?->name ?? 'Unknown',
            'author_profile_image_url' => $comment->user?->profile_image_url,
            'created_at' => $comment->created_at?->timezone($tz)->format('d M Y, h:i A'),
            'is_mine' => $comment->user_id === auth()->id(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function formatActivities(DraftingRequest $draftingRequest, string $tz): array
    {
        return DraftingRequestActivity::query()
            ->where('drafting_request_id', $draftingRequest->id)
            ->with('user:id,name,profile_image')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (DraftingRequestActivity $activity) => $this->formatActivity($activity, $tz))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatActivity(DraftingRequestActivity $activity, string $tz): array
    {
        return [
            'id' => $activity->id,
            'action' => $activity->action,
            'action_label' => match ($activity->action) {
                DraftingRequestActivity::ACTION_REQUEST_SUBMITTED => 'Submitted drafting request',
                DraftingRequestActivity::ACTION_COMMENT_POSTED => 'Posted a comment',
                default => 'Activity',
            },
            'description' => $activity->description,
            'user_name' => $activity->user?->name ?? 'Unknown',
            'user_profile_image_url' => $activity->user?->profile_image_url,
            'created_at' => $activity->created_at?->timezone($tz)->format('d M Y, h:i A'),
            'is_mine' => $activity->user_id === auth()->id(),
        ];
    }

    private function commentActivityDescription(string $body): string
    {
        $text = trim(strip_tags($body));

        if ($text === '') {
            return 'Added a comment with rich text only.';
        }

        return Str::limit($text, 200);
    }

    private function formatFileSize(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }

        if ($bytes < 1024 * 1024) {
            return round($bytes / 1024, 1).' KB';
        }

        return round($bytes / (1024 * 1024), 1).' MB';
    }

    /**
     * @return array{0: string, 1: int}
     */
    private function resolveListFilters(Request $request): array
    {
        $search = Str::limit(trim((string) $request->input('search', '')), 255);
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 5 || $perPage > 50) {
            $perPage = 10;
        }

        return [$search, $perPage];
    }
}
