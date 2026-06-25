<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDraftingRequestFormRequest;
use App\Models\BuildingType;
use App\Models\DraftingRequest;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\ServiceEngaging;
use App\Services\DraftingRequestSubmissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DraftingRequestFormController extends Controller
{
    public function __construct(
        private DraftingRequestSubmissionService $submission,
    ) {}

    public function create(Request $request): Response
    {
        $requestedAt = now(config('app.timezone'))->seconds(0)->format('Y-m-d\TH:i');

        return Inertia::render('Job/DraftingRequestForm', [
            'standalone' => false,
            'submitted' => false,
            'applicant' => [
                'requested_at' => $requestedAt,
            ],
            'serviceEngagings' => ServiceEngaging::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
            'buildingTypes' => BuildingType::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
            'externalWallConstructions' => ExternalWallConstruction::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
            'roofTypes' => RoofType::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(StoreDraftingRequestFormRequest $request): RedirectResponse
    {
        $this->submission->store(
            $request,
            $request->user(),
            DraftingRequest::REVIEW_ACCEPTED,
        );

        return redirect()
            ->route('job.board')
            ->with('status', 'drf-submitted');
    }
}
