<?php

namespace App\Http\Controllers\Job;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDraftingRequestFormRequest;
use App\Models\BuildingType;
use App\Models\DraftingRequest;
use App\Models\DraftingRequestActivity;
use App\Models\DraftingRequestFile;
use App\Models\ExternalWallConstruction;
use App\Models\RoofType;
use App\Models\ServiceEngaging;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DraftingRequestFormController extends Controller
{
    private const PRIVATE_DISK = 'local';

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
        $validated = $request->safe()->except(['facade', 'documents', 'service_engaging_ids']);

        DB::transaction(function () use ($request, $user, $validated) {
            $draftingRequest = DraftingRequest::query()->create([
                'user_id' => $user->id,
                'status' => DraftingRequest::STATUS_ALLOCATED,
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

            DraftingRequestActivity::record(
                $draftingRequest,
                $user,
                DraftingRequestActivity::ACTION_REQUEST_SUBMITTED,
                sprintf(
                    'Drafting request %s was submitted.',
                    sprintf('DRF-%05d', $draftingRequest->id),
                ),
            );
        });

        return redirect()
            ->route('job.board')
            ->with('status', 'drf-submitted');
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
