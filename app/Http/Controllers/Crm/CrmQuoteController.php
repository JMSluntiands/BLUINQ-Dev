<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCrmQuoteCommentRequest;
use App\Models\CrmQuote;
use App\Models\CrmQuoteActivity;
use App\Models\CrmQuoteComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CrmQuoteController extends Controller
{
    public function index(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = $this->baseListQuery($request)->active();
        $this->applySearch($query, $search);

        return Inertia::render('Crm/QuoteList', [
            'quotes' => $query
                ->paginate($perPage)
                ->through(fn (CrmQuote $row) => $this->formatListRow($row))
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canViewAllQuotes' => $request->user()->isAdmin(),
        ]);
    }

    public function archive(Request $request): Response
    {
        [$search, $perPage] = $this->resolveListFilters($request);

        $query = $this->baseListQuery($request)
            ->archived()
            ->orderByDesc('archived_at');

        $this->applySearch($query, $search);

        return Inertia::render('Crm/QuoteArchive', [
            'quotes' => $query
                ->paginate($perPage)
                ->through(fn (CrmQuote $row) => [
                    ...$this->formatListRow($row),
                    'archived_at' => $row->archived_at?->toIso8601String(),
                ])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'canViewAllQuotes' => $request->user()->isAdmin(),
        ]);
    }

    public function show(Request $request, CrmQuote $crmQuote): Response
    {
        $user = $request->user();

        if (! $user->isAdmin() && $crmQuote->user_id !== $user->id) {
            abort(403);
        }

        $crmQuote->load([
            'user:id,name,email',
            'arrivalInputFile:id,name',
            'crmCategory:id,name',
            'levelOfDifficulty:id,name',
            'buildingType:id,name',
            'scopeOfWork:id,name',
            'deliverable:id,name',
            'comments' => fn ($query) => $query
                ->with('user:id,name,profile_image')
                ->orderBy('created_at'),
        ]);

        $tz = config('app.timezone');
        $listFilters = $this->listFiltersFromRequest($request);

        $comments = $crmQuote->comments;

        return Inertia::render('Crm/QuoteShow', [
            'quote' => [
                'id' => $crmQuote->id,
                'reference' => sprintf('QDF-%05d', $crmQuote->id),
                'status' => $crmQuote->status,
                'status_label' => $crmQuote->statusLabel(),
                'requested_at' => $crmQuote->requested_at?->timezone($tz)->format('d M Y, h:i A'),
                'client_company_name' => $crmQuote->client_company_name,
                'project_job_number' => $crmQuote->project_job_number,
                'site_address' => $crmQuote->site_address,
                'site_owner_name' => $crmQuote->site_owner_name,
                'arrival_input_file' => $crmQuote->arrivalInputFile?->name,
                'crm_category' => $crmQuote->crmCategory?->name,
                'level_of_difficulty' => $crmQuote->levelOfDifficulty?->name,
                'building_type' => $crmQuote->buildingType?->name,
                'scope_of_work' => $crmQuote->scopeOfWork?->name,
                'deliverable' => $crmQuote->deliverable?->name,
                'building_area_size' => $crmQuote->building_area_size,
                'estimated_time_allocation' => $crmQuote->estimated_time_allocation,
                'remarks' => $crmQuote->remarks,
                'is_archived' => $crmQuote->isArchived(),
                'archived_at' => $crmQuote->archived_at?->timezone($tz)->format('d M Y, h:i A'),
                'submitted_by' => $crmQuote->user?->name ?? 'Unknown',
                'submitted_at' => $crmQuote->created_at?->timezone($tz)->format('d M Y, h:i A'),
                'comments' => $this->formatCommentsByKind($comments, CrmQuoteComment::KIND_COMMENT, $tz),
                'run_comments' => $this->formatCommentsByKind($comments, CrmQuoteComment::KIND_RUN, $tz),
                'activities' => $this->formatActivities($crmQuote, $tz),
            ],
            'listFilters' => $listFilters,
            'canEdit' => $user->isAdmin() && ! $crmQuote->isArchived(),
            'canUseRunComments' => $user->isAdmin(),
        ]);
    }

    public function storeComment(StoreCrmQuoteCommentRequest $request, CrmQuote $crmQuote): RedirectResponse
    {
        $user = $request->user();

        if (! $user->isAdmin() && $crmQuote->user_id !== $user->id) {
            abort(403);
        }

        if ($crmQuote->isArchived()) {
            abort(404);
        }

        $kind = $request->validated('kind');
        if ($kind === CrmQuoteComment::KIND_RUN && ! $user->isAdmin()) {
            abort(403);
        }

        $body = $request->sanitizedBody();

        $crmQuote->comments()->create([
            'user_id' => $user->id,
            'kind' => $kind,
            'body' => $body,
        ]);

        $isRun = $kind === CrmQuoteComment::KIND_RUN;
        $text = trim(strip_tags($body));
        $desc = $text === ''
            ? ($isRun ? 'Added a run comment.' : 'Added a comment.')
            : ($isRun ? 'Run comment: ' : '').Str::limit($text, 200);

        CrmQuoteActivity::record(
            $crmQuote,
            $user,
            $isRun
                ? CrmQuoteActivity::ACTION_RUN_COMMENT_POSTED
                : CrmQuoteActivity::ACTION_COMMENT_POSTED,
            $desc,
        );

        $flash = $isRun ? 'run-comment-added' : 'comment-added';

        return redirect()->back()->with('status', $flash);
    }

    public function destroy(Request $request, CrmQuote $crmQuote): RedirectResponse
    {
        $crmQuote->update(['archived_at' => now()]);

        CrmQuoteActivity::record(
            $crmQuote,
            $request->user(),
            CrmQuoteActivity::ACTION_ARCHIVED,
            sprintf('Quote %s was archived.', sprintf('QDF-%05d', $crmQuote->id)),
        );

        return redirect()
            ->route('crm.quotes', $this->redirectQuery($request))
            ->with('status', 'crm-quote-archived');
    }

    public function restore(Request $request, CrmQuote $crmQuote): RedirectResponse
    {
        $crmQuote->update(['archived_at' => null]);

        CrmQuoteActivity::record(
            $crmQuote,
            $request->user(),
            CrmQuoteActivity::ACTION_RESTORED,
            sprintf('Quote %s was restored.', sprintf('QDF-%05d', $crmQuote->id)),
        );

        return redirect()
            ->route('crm.quotes.archive', $this->redirectQuery($request))
            ->with('status', 'crm-quote-restored');
    }

    private function baseListQuery(Request $request)
    {
        $user = $request->user();

        $query = CrmQuote::query()
            ->with('user:id,name')
            ->orderByDesc('requested_at')
            ->orderByDesc('id');

        if (! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query;
    }

    private function applySearch($query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $query->where(function ($q) use ($search) {
            $q->where('client_company_name', 'like', '%'.$search.'%')
                ->orWhere('project_job_number', 'like', '%'.$search.'%')
                ->orWhere('site_address', 'like', '%'.$search.'%');
        });
    }

    private function formatListRow(CrmQuote $row): array
    {
        return [
            'id' => $row->id,
            'requested_at' => $row->requested_at
                ?->timezone(config('app.timezone'))
                ->format('d M Y, h:i A'),
            'client_company_name' => $row->client_company_name,
            'project_job_number' => $row->project_job_number,
            'site_address' => $row->site_address,
            'status' => $row->status,
            'status_label' => $row->statusLabel(),
        ];
    }

    private function redirectQuery(Request $request): array
    {
        return array_filter([
            'search' => $request->query('search'),
            'per_page' => $request->query('per_page'),
        ]);
    }

    /**
     * @return array{search: string, per_page: int|null, from: string|null}
     */
    private function listFiltersFromRequest(Request $request): array
    {
        $perPage = $request->query('per_page');

        return [
            'search' => Str::limit(trim((string) $request->query('search', '')), 255),
            'per_page' => $perPage !== null && $perPage !== ''
                ? (int) $perPage
                : null,
            'from' => $request->query('from') === 'archive' ? 'archive' : null,
        ];
    }

    private function formatComment(CrmQuoteComment $comment, string $tz): array
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

    private function formatCommentsByKind($comments, string $kind, string $tz): array
    {
        return $comments
            ->where('kind', $kind)
            ->map(fn (CrmQuoteComment $c) => $this->formatComment($c, $tz))
            ->values()
            ->all();
    }

    private function formatActivities(CrmQuote $crmQuote, string $tz): array
    {
        return CrmQuoteActivity::query()
            ->where('crm_quote_id', $crmQuote->id)
            ->with('user:id,name,profile_image')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (CrmQuoteActivity $a) => [
                'id' => $a->id,
                'action' => $a->action,
                'action_label' => match ($a->action) {
                    CrmQuoteActivity::ACTION_QUOTE_SUBMITTED => 'Submitted quote',
                    CrmQuoteActivity::ACTION_COMMENT_POSTED => 'Posted a comment',
                    CrmQuoteActivity::ACTION_RUN_COMMENT_POSTED => 'Posted a run comment',
                    CrmQuoteActivity::ACTION_ARCHIVED => 'Archived quote',
                    CrmQuoteActivity::ACTION_RESTORED => 'Restored quote',
                    default => 'Activity',
                },
                'description' => $a->description,
                'user_name' => $a->user?->name ?? 'Unknown',
                'user_profile_image_url' => $a->user?->profile_image_url,
                'created_at' => $a->created_at?->timezone($tz)->format('d M Y, h:i A'),
                'is_mine' => $a->user_id === auth()->id(),
            ])
            ->all();
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
