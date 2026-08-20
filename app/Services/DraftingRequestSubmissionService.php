<?php

namespace App\Services;

use App\Http\Requests\StoreDraftingRequestFormRequest;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestFile;
use App\Models\DraftingRequestRevision;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DraftingRequestSubmissionService
{
    private const PRIVATE_DISK = 'local';

    public function store(
        StoreDraftingRequestFormRequest $request,
        ?User $user,
        string $reviewStatus,
        string $workflowStage = DraftingRequest::STAGE_MASTERLIST,
    ): DraftingRequest {
        $validated = $request->safe()->except(['documents', 'service_engaging_ids', 'sda_type_ids', 'crm_category_ids']);

        return DB::transaction(function () use ($request, $user, $validated, $reviewStatus, $workflowStage) {
            $draftingRequest = DraftingRequest::query()->create([
                'user_id' => $user?->id,
                'status' => DraftingRequest::STATUS_NEW,
                'review_status' => $reviewStatus,
                'workflow_stage' => $workflowStage,
                ...$validated,
            ]);

            $draftingRequest->serviceEngagings()->sync(
                $request->validated('service_engaging_ids') ?? [],
            );

            $draftingRequest->sdaTypes()->sync(
                $request->validated('sda_type_ids') ?? [],
            );

            $draftingRequest->crmCategories()->sync(
                $request->validated('crm_category_ids') ?? [],
            );

            foreach ($request->file('documents', []) as $file) {
                if ($file instanceof UploadedFile && $file->isValid()) {
                    $this->storeUploadedFile(
                        $draftingRequest,
                        $file,
                        DraftingRequestFile::KIND_DOCUMENT,
                        'documents',
                    );
                }
            }

            $reference = $draftingRequest->jobNumber();
            $description = $reviewStatus === DraftingRequest::REVIEW_PENDING
                ? sprintf('Public drafting request %s was submitted and is awaiting review.', $reference)
                : sprintf('Drafting request %s was submitted to the masterlist.', $reference);

            DraftingRequestActivity::record(
                $draftingRequest,
                $user,
                DraftingRequestActivity::ACTION_REQUEST_SUBMITTED,
                $description,
            );

            return $draftingRequest;
        });
    }

    public function update(
        StoreDraftingRequestFormRequest $request,
        DraftingRequest $draftingRequest,
        User $actor,
        bool $allowApmStage = false,
    ): DraftingRequest {
        $isMasterlist = $draftingRequest->workflow_stage === DraftingRequest::STAGE_MASTERLIST;
        $isEditableBoard = $allowApmStage
            && $draftingRequest->isOnProjectBoard()
            && $draftingRequest->review_status === DraftingRequest::REVIEW_ACCEPTED;

        if (! $isMasterlist && ! $isEditableBoard) {
            throw ValidationException::withMessages([
                'workflow_stage' => 'Only masterlist entries can be edited here.',
            ]);
        }

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        $validated = $request->safe()->except(['documents', 'service_engaging_ids', 'sda_type_ids', 'crm_category_ids']);

        return DB::transaction(function () use ($request, $draftingRequest, $actor, $validated, $isMasterlist) {
            $previousLead = array_key_exists('lead_number', $validated)
                ? $draftingRequest->jobNumber()
                : null;

            $draftingRequest->update($validated);

            if ($previousLead !== null) {
                $newLead = trim((string) ($validated['lead_number'] ?? ''));
                if ($newLead !== '' && $newLead !== $previousLead) {
                    $draftingRequest->rebaseRevisionCodes($previousLead, $newLead);
                }
            }

            $draftingRequest->serviceEngagings()->sync(
                $request->validated('service_engaging_ids') ?? [],
            );

            $draftingRequest->sdaTypes()->sync(
                $request->validated('sda_type_ids') ?? [],
            );

            $draftingRequest->crmCategories()->sync(
                $request->validated('crm_category_ids') ?? [],
            );

            foreach ($request->file('documents', []) as $file) {
                if ($file instanceof UploadedFile && $file->isValid()) {
                    $this->storeUploadedFile(
                        $draftingRequest,
                        $file,
                        DraftingRequestFile::KIND_DOCUMENT,
                        'documents',
                    );
                }
            }

            DraftingRequestActivity::record(
                $draftingRequest,
                $actor,
                DraftingRequestActivity::ACTION_DETAILS_UPDATED,
                sprintf(
                    $isMasterlist
                        ? 'Masterlist entry %s was updated.'
                        : 'Project %s was updated before adding to the board.',
                    $draftingRequest->jobNumber(),
                ),
            );

            return $draftingRequest->fresh();
        });
    }

    public function accept(DraftingRequest $draftingRequest, User $reviewer): void
    {
        DB::transaction(function () use ($draftingRequest, $reviewer): void {
            $draftingRequest->update([
                'review_status' => DraftingRequest::REVIEW_ACCEPTED,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now('UTC'),
                'status' => DraftingRequest::STATUS_NEW,
                'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            ]);

            DraftingRequestActivity::record(
                $draftingRequest,
                $reviewer,
                DraftingRequestActivity::ACTION_REQUEST_ACCEPTED,
                sprintf(
                    'Drafting request %s was accepted and added to the masterlist.',
                    $draftingRequest->jobNumber(),
                ),
            );
        });
    }

    public function forwardToApm(DraftingRequest $draftingRequest, User $actor): void
    {
        $this->forwardToBoard($draftingRequest, $actor, 'apm');
    }

    public function forwardToBoard(DraftingRequest $draftingRequest, User $actor, string $board = 'apm'): void
    {
        $board = $board === 'design' ? 'design' : 'apm';
        $stage = $board === 'design'
            ? DraftingRequest::STAGE_DESIGN
            : DraftingRequest::STAGE_APM;
        $boardLabel = $board === 'design'
            ? 'Design Project Management'
            : 'Archi Project Management';

        if ($draftingRequest->workflow_stage !== DraftingRequest::STAGE_MASTERLIST) {
            throw ValidationException::withMessages([
                'workflow_stage' => "This entry has already been forwarded to {$boardLabel}.",
            ]);
        }

        if ($draftingRequest->review_status !== DraftingRequest::REVIEW_ACCEPTED) {
            throw ValidationException::withMessages([
                'review_status' => "Only accepted masterlist entries can be forwarded to {$boardLabel}.",
            ]);
        }

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        DB::transaction(function () use ($draftingRequest, $actor, $stage, $boardLabel): void {
            $draftingRequest->update([
                'workflow_stage' => $stage,
            ]);

            if (! $draftingRequest->revisions()->exists()) {
                $category = $this->revisionCategoryFor($draftingRequest);

                DraftingRequestRevision::query()->create([
                    'drafting_request_id' => $draftingRequest->id,
                    'user_id' => $actor->id,
                    'code' => $draftingRequest->jobNumber().'-01',
                    'log_date' => now(config('app.timezone'))->toDateString(),
                    'category' => $category,
                    'drafter_user_id' => $actor->id,
                    'drafter_initials' => $actor->badgeInitials(),
                    'status' => DraftingRequest::STATUS_NEW,
                ]);
            }

            DraftingRequestActivity::record(
                $draftingRequest,
                $actor,
                DraftingRequestActivity::ACTION_FORWARDED_TO_APM,
                sprintf(
                    'Drafting request %s was forwarded to %s.',
                    $draftingRequest->jobNumber(),
                    $boardLabel,
                ),
            );
        });
    }

    /**
     * After the last APM revision is removed, return the job to masterlist
     * so it leaves the board and can be added again from the dropdown.
     */
    public function returnToMasterlistIfNoRevisions(
        DraftingRequest $draftingRequest,
        ?User $actor = null,
    ): bool {
        if (! $draftingRequest->isOnProjectBoard()) {
            return false;
        }

        if ($draftingRequest->revisions()->exists()) {
            return false;
        }

        DB::transaction(function () use ($draftingRequest, $actor): void {
            $draftingRequest->assignments()->delete();

            $draftingRequest->update([
                'workflow_stage' => DraftingRequest::STAGE_MASTERLIST,
            ]);

            DraftingRequestActivity::record(
                $draftingRequest,
                $actor,
                DraftingRequestActivity::ACTION_RETURNED_TO_MASTERLIST,
                sprintf(
                    'Drafting request %s was returned to the masterlist after its last revision was deleted.',
                    $draftingRequest->jobNumber(),
                ),
            );
        });

        return true;
    }

    /**
     * Heal APM board rows that have no revisions left (e.g. deleted before
     * return-to-masterlist was wired). Clears board assignments and stage.
     */
    public function returnOrphanApmJobsToMasterlist(?User $actor = null): int
    {
        $orphans = DraftingRequest::query()
            ->onProjectBoard()
            ->active()
            ->whereDoesntHave('revisions')
            ->get();

        $count = 0;

        foreach ($orphans as $draftingRequest) {
            if ($this->returnToMasterlistIfNoRevisions($draftingRequest, $actor)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Add a masterlist job to APM or Design, or reopen an existing board job.
     *
     * @return array{action: 'forwarded'|'reopened', revision_code: string|null}
     */
    public function addOrReopenOnBoard(
        DraftingRequest $draftingRequest,
        User $actor,
        string $board = 'apm',
    ): array {
        $board = $board === 'design' ? 'design' : 'apm';

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        if ($draftingRequest->workflow_stage === DraftingRequest::STAGE_MASTERLIST) {
            $this->forwardToBoard($draftingRequest, $actor, $board);

            $code = DraftingRequestRevision::query()
                ->where('drafting_request_id', $draftingRequest->id)
                ->orderByDesc('id')
                ->value('code');

            return [
                'action' => 'forwarded',
                'revision_code' => $code !== null ? (string) $code : null,
            ];
        }

        $targetStage = $board === 'design'
            ? DraftingRequest::STAGE_DESIGN
            : DraftingRequest::STAGE_APM;

        if ($draftingRequest->workflow_stage !== $targetStage
            && $draftingRequest->isOnProjectBoard()) {
            $draftingRequest->update([
                'workflow_stage' => $targetStage,
            ]);
        }

        if ($draftingRequest->fresh()?->workflow_stage === $targetStage
            && $draftingRequest->review_status === DraftingRequest::REVIEW_ACCEPTED) {
            return $this->reopenOnBoard($draftingRequest->fresh(), $actor);
        }

        abort(404);
    }

    /**
     * @return array{action: 'reopened', revision_code: string}
     */
    private function reopenOnBoard(DraftingRequest $draftingRequest, User $actor): array
    {
        return DB::transaction(function () use ($draftingRequest, $actor) {
            $draftingRequest->loadMissing(['crmCategory', 'serviceEngagings', 'revisions']);

            $code = $draftingRequest->suggestNextRevisionCode();
            $previousStatus = $draftingRequest->status;
            $category = $this->revisionCategoryFor($draftingRequest);

            $revision = DraftingRequestRevision::query()->create([
                'drafting_request_id' => $draftingRequest->id,
                'user_id' => $actor->id,
                'code' => $code,
                'log_date' => now(config('app.timezone'))->toDateString(),
                'category' => $category,
                'drafter_user_id' => $actor->id,
                'drafter_initials' => $actor->badgeInitials(),
                'status' => DraftingRequest::STATUS_NEW,
            ]);

            $draftingRequest->update([
                'status' => DraftingRequest::STATUS_NEW,
            ]);

            DraftingRequestActivity::record(
                $draftingRequest,
                $actor,
                DraftingRequestActivity::ACTION_REVISION_ADDED,
                sprintf(
                    'Reopened on Project Management board with revision %s.',
                    $revision->code,
                ),
            );

            if ($previousStatus !== DraftingRequest::STATUS_NEW) {
                $options = DraftingRequest::statusLabels();
                $fromLabel = $options[$previousStatus]
                    ?? ($previousStatus ? ucfirst(str_replace('_', ' ', $previousStatus)) : 'New');

                DraftingRequestActivity::record(
                    $draftingRequest,
                    $actor,
                    DraftingRequestActivity::ACTION_STATUS_CHANGED,
                    sprintf('Status changed from %s to New.', $fromLabel),
                );
            }

            return [
                'action' => 'reopened',
                'revision_code' => $revision->code,
            ];
        });
    }

    private function revisionCategoryFor(DraftingRequest $draftingRequest): string
    {
        $draftingRequest->loadMissing(['crmCategories', 'crmCategory', 'serviceEngagings']);

        $fromMany = $draftingRequest->crmCategories
            ->map(fn ($category) => $category->code ?: $category->name)
            ->filter()
            ->values();

        if ($fromMany->isNotEmpty()) {
            return $fromMany->join(', ');
        }

        return $draftingRequest->crmCategory?->code
            ?: $draftingRequest->crmCategory?->name
            ?: $draftingRequest->serviceEngagings->sortBy('name')->first()?->name
            ?: 'Working Drawings';
    }

    private function storeUploadedFile(
        DraftingRequest $draftingRequest,
        UploadedFile $file,
        string $kind,
        string $directory,
    ): void {
        $path = $file->store(
            'drafting-requests/'.$draftingRequest->id.'/'.$directory,
            self::PRIVATE_DISK,
        );

        $draftingRequest->files()->create([
            'kind' => $kind,
            'disk' => self::PRIVATE_DISK,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize() ?: 0,
        ]);
    }
}
