<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCrmQuoteFormRequest;
use App\Models\ArrivalInputFile;
use App\Models\BuildingType;
use App\Models\CrmCategory;
use App\Models\CrmQuote;
use App\Models\CrmQuoteActivity;
use App\Models\Deliverable;
use App\Models\LevelOfDifficulty;
use App\Models\ScopeOfWork;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CrmQuoteFormController extends Controller
{
    public function create(Request $request): Response
    {
        $requestedAt = now(config('app.timezone'))->seconds(0)->format('Y-m-d\TH:i');

        return Inertia::render('Crm/QuoteDetailsForm', [
            'defaults' => [
                'requested_at' => $requestedAt,
            ],
            'arrivalInputFiles' => ArrivalInputFile::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
            'categories' => CrmCategory::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
            'levelsOfDifficulty' => LevelOfDifficulty::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
            'buildingTypes' => BuildingType::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
            'scopesOfWork' => ScopeOfWork::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
            'deliverables' => Deliverable::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(StoreCrmQuoteFormRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $quote = CrmQuote::query()->create([
            'user_id' => $user->id,
            'status' => CrmQuote::STATUS_ALLOCATED,
            ...$validated,
        ]);

        CrmQuoteActivity::record(
            $quote,
            $user,
            CrmQuoteActivity::ACTION_QUOTE_SUBMITTED,
            sprintf('Quote %s was submitted.', sprintf('QDF-%05d', $quote->id)),
        );

        return redirect()
            ->route('crm.quotes')
            ->with('status', 'crm-quote-submitted');
    }
}
