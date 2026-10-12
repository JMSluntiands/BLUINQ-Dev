<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePublicHolidayRequest;
use App\Models\PublicHoliday;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PublicHolidayController extends Controller
{
    public function store(StorePublicHolidayRequest $request): RedirectResponse
    {
        PublicHoliday::query()->create([
            'region' => $request->validated('region'),
            'holiday_date' => $request->validated('holiday_date'),
            'name' => $request->validated('name'),
            'user_id' => $request->user()->id,
        ]);

        return back()->with('status', 'public-holiday-created');
    }

    public function destroy(Request $request, PublicHoliday $publicHoliday): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $publicHoliday->delete();

        return back()->with('status', 'public-holiday-deleted');
    }
}
