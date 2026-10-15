<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePublicHolidayRequest;
use App\Models\PublicHoliday;
use App\Services\HolidayService;
use App\Support\AppClock;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicHolidayController extends Controller
{
    public function __construct(private HolidayService $holidays) {}

    public function index(Request $request): Response
    {
        $year = (int) $request->input('year', AppClock::today()->year);
        if ($year < 2000 || $year > 2100) {
            $year = AppClock::today()->year;
        }

        return Inertia::render('Leave/Holidays/Index', [
            'holidays' => $this->holidays->manageList($year),
            'year' => $year,
            'years' => range($year - 1, $year + 2),
            'regions' => HolidayService::regionChoices(),
        ]);
    }

    public function store(StorePublicHolidayRequest $request): RedirectResponse
    {
        /** @var list<array{region: string, holiday_date: string, name: string, repeats_yearly?: bool}> $rows */
        $rows = $request->validated('holidays');

        DB::transaction(function () use ($request, $rows): void {
            foreach ($rows as $row) {
                PublicHoliday::query()->create([
                    'region' => $row['region'],
                    'holiday_date' => $row['holiday_date'],
                    'name' => $row['name'],
                    'repeats_yearly' => (bool) ($row['repeats_yearly'] ?? false),
                    'user_id' => $request->user()->id,
                ]);
            }
        });

        return redirect()
            ->route('public-holidays.index', [
                'year' => Carbon::parse($rows[0]['holiday_date'])->year,
            ])
            ->with('status', count($rows) === 1 ? 'public-holiday-created' : 'public-holidays-created');
    }

    public function destroy(Request $request, PublicHoliday $publicHoliday): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission('leave.manage'), 403);

        $publicHoliday->delete();

        return back()->with('status', 'public-holiday-deleted');
    }
}
