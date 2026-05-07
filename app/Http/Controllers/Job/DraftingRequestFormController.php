<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDraftingRequestFormRequest;
use App\Models\BuildingType;
use App\Models\DraftingRequest;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\ServiceEngaging;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DraftingRequestFormController extends Controller
{
    public function create(Request $request): Response
    {
        $user = $request->user();

        $requestedAt = now(config('app.timezone'))->seconds(0)->format('Y-m-d\TH:i');

        return Inertia::render('Job/DraftingRequestForm', [
            'applicant' => [
                'requested_at' => $requestedAt,
                'your_name' => $user->name,
                'company_name' => $user->company_name ?? '',
                'email' => $user->email,
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
        $user = $request->user();
        $payload = $request->safe()->except(['facade', 'documents']);

        $draftingRequest = DraftingRequest::query()->create([
            'user_id' => $user->id,
            'payload' => $payload,
        ]);

        $extra = [];

        if ($request->hasFile('facade')) {
            $extra['facade_path'] = $request->file('facade')->store(
                'drafting-requests/'.$draftingRequest->id,
                'public',
            );
        }

        $documentPaths = [];
        foreach ($request->file('documents', []) as $file) {
            if ($file !== null && $file->isValid()) {
                $documentPaths[] = $file->store(
                    'drafting-requests/'.$draftingRequest->id,
                    'public',
                );
            }
        }

        if ($documentPaths !== []) {
            $extra['document_paths'] = $documentPaths;
        }

        if ($extra !== []) {
            $draftingRequest->update([
                'payload' => array_merge($draftingRequest->payload, $extra),
            ]);
        }

        return redirect()
            ->route('job.drafting')
            ->with('status', 'drf-submitted');
    }
}
