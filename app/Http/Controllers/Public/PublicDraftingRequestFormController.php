<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePublicDraftingRequestFormRequest;
use App\Models\BuildingClass;
use App\Models\CrmCategory;
use App\Models\DraftingRequest;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\SdaType;
use App\Models\StoreyLevel;
use App\Services\DraftingRequestSubmissionService;
use App\Support\PublicDraftingFormUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicDraftingRequestFormController extends Controller
{
    public function __construct(
        private DraftingRequestSubmissionService $submission,
    ) {}

    public function create(Request $request): Response
    {
        $timezone = config('app.timezone') ?: 'UTC';
        $requestedAt = now($timezone)->seconds(0)->format('Y-m-d\TH:i');

        return Inertia::render('Job/DraftingRequestForm', [
            'standalone' => true,
            'submitted' => session('status') === 'public-drf-submitted',
            'submitUrl' => PublicDraftingFormUrl::submitUrl($request),
            'applicant' => [
                'requested_at' => $requestedAt,
            ],
            'clients' => \App\Support\ClientFormOptions::forForms(),
            'categories' => CrmCategory::query()
                ->active()
                ->orderBy('code')
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'sdaTypes' => SdaType::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'storeyLevels' => StoreyLevel::query()
                ->active()
                ->orderBy('code')
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'buildingClasses' => BuildingClass::activeForSelect(),
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
            ->to(PublicDraftingFormUrl::submitUrl($request))
            ->with('status', 'public-drf-submitted');
    }
}
