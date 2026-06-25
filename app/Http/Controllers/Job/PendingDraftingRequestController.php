<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Models\DraftingRequest;
use App\Services\DraftingRequestReviewService;
use App\Services\DraftingRequestSubmissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PendingDraftingRequestController extends Controller
{
    public function __construct(
        private DraftingRequestReviewService $review,
        private DraftingRequestSubmissionService $submission,
    ) {}

    public function index(Request $request): RedirectResponse
    {
        return redirect()->route('job.board');
    }

    public function accept(Request $request, DraftingRequest $draftingRequest): RedirectResponse
    {
        abort_unless(
            auth()->user()?->hasPermission('job.drafting-request.review'),
            403,
        );

        if ($draftingRequest->review_status !== DraftingRequest::REVIEW_PENDING) {
            return back()->with('status', 'drf-already-reviewed');
        }

        $this->submission->accept($draftingRequest, auth()->user());

        return back()->with('status', 'drf-accepted');
    }
}
