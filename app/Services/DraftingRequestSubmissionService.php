<?php

namespace App\Services;

use App\Http\Requests\StoreDraftingRequestFormRequest;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestFile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class DraftingRequestSubmissionService
{
    private const PRIVATE_DISK = 'local';

    public function store(
        StoreDraftingRequestFormRequest $request,
        ?User $user,
        string $reviewStatus,
    ): DraftingRequest {
        $validated = $request->safe()->except(['facade', 'documents', 'service_engaging_ids']);

        return DB::transaction(function () use ($request, $user, $validated, $reviewStatus) {
            $draftingRequest = DraftingRequest::query()->create([
                'user_id' => $user?->id,
                'status' => DraftingRequest::STATUS_NEW,
                'review_status' => $reviewStatus,
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
                : sprintf('Drafting request %s was submitted.', $reference);

            DraftingRequestActivity::record(
                $draftingRequest,
                $user,
                DraftingRequestActivity::ACTION_REQUEST_SUBMITTED,
                $description,
            );

            return $draftingRequest;
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
            ]);

            DraftingRequestActivity::record(
                $draftingRequest,
                $reviewer,
                DraftingRequestActivity::ACTION_REQUEST_ACCEPTED,
                sprintf(
                    'Drafting request %s was accepted and added to the job board.',
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
