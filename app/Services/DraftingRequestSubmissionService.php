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
        $validated = $request->safe()->except(['facade', 'documents', 'service_engaging_ids']);

        return DB::transaction(function () use ($request, $user, $validated, $reviewStatus, $workflowStage) {
            $draftingRequest = DraftingRequest::query()->create([
                'user_id' => $user?->id,
                'status' => DraftingRequest::STATUS_NEW,
                'review_status' => $reviewStatus,
                'workflow_stage' => $workflowStage,
                ...$validated,
            ]);

            $draftingRequest->serviceEngagings()->sync(
                $request->validated('service_engaging_ids'),
            );

            if ($request->hasFile('facade')) {
                $this->storeUploadedFile(
                    $draftingRequest,
                    $request->file('facade'),
                    DraftingRequestFile::KIND_FACADE,
                    'facade',
                );
            }

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
    ): DraftingRequest {
        if ($draftingRequest->workflow_stage !== DraftingRequest::STAGE_MASTERLIST) {
            throw ValidationException::withMessages([
                'workflow_stage' => 'Only masterlist entries can be edited here.',
            ]);
        }

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        $validated = $request->safe()->except(['facade', 'documents', 'service_engaging_ids']);

        return DB::transaction(function () use ($request, $draftingRequest, $actor, $validated) {
            $draftingRequest->update($validated);

            $draftingRequest->serviceEngagings()->sync(
                $request->validated('service_engaging_ids'),
            );

            if ($request->hasFile('facade')) {
                $this->storeUploadedFile(
                    $draftingRequest,
                    $request->file('facade'),
                    DraftingRequestFile::KIND_FACADE,
                    'facade',
                );
            }

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
                    'Masterlist entry %s was updated.',
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
        if ($draftingRequest->workflow_stage !== DraftingRequest::STAGE_MASTERLIST) {
            throw ValidationException::withMessages([
                'workflow_stage' => 'This entry has already been forwarded to APM.',
            ]);
        }

        if ($draftingRequest->review_status !== DraftingRequest::REVIEW_ACCEPTED) {
            throw ValidationException::withMessages([
                'review_status' => 'Only accepted masterlist entries can be forwarded to APM.',
            ]);
        }

        if ($draftingRequest->isArchived()) {
            abort(404);
        }

        DB::transaction(function () use ($draftingRequest, $actor): void {
            $draftingRequest->update([
                'workflow_stage' => DraftingRequest::STAGE_APM,
            ]);

            if (! $draftingRequest->revisions()->exists()) {
                $category = $draftingRequest->serviceEngagings()
                    ->orderBy('name')
                    ->value('name')
                    ?? 'Working Drawings';

                DraftingRequestRevision::query()->create([
                    'drafting_request_id' => $draftingRequest->id,
                    'user_id' => $actor->id,
                    'code' => $draftingRequest->jobNumber(),
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
                    'Drafting request %s was forwarded to Archi Project Management.',
                    $draftingRequest->jobNumber(),
                ),
            );
        });
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
