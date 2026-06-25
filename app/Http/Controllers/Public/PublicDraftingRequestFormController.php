<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePublicDraftingRequestFormRequest;
use App\Models\BuildingType;
use App\Models\DraftingRequest;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\ServiceEngaging;
use App\Services\DraftingRequestSubmissionService;
use App\Support\PublicDraftingFormUrl;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PublicDraftingRequestFormController extends Controller
{
    public function __construct(
        private DraftingRequestSubmissionService $submission,
    ) {}

    public function create(): Response
    {
        $requestedAt = now(config('app.timezone'))->seconds(0)->format('Y-m-d\TH:i');

        return Inertia::render('Public/DraftingRequestForm', [
            'standalone' => true,
            'submitted' => session('status') === 'public-drf-submitted',
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

    public function store(StorePublicDraftingRequestFormRequest $request): RedirectResponse
    {
        $this->submission->store(
            $request,
            null,
            DraftingRequest::REVIEW_PENDING,
        );

        return redirect()
            ->to(PublicDraftingFormUrl::base())
            ->with('status', 'public-drf-submitted');
    }
}
