<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCalendarEventRequest;
use App\Models\CalendarEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CalendarEventController extends Controller
{
    public function store(StoreCalendarEventRequest $request): RedirectResponse
    {
        $startDate = $request->validated('start_date');
        $endDate = $request->validated('end_date') ?? $startDate;

        CalendarEvent::query()->create([
            'user_id' => $request->user()->id,
            'title' => $request->validated('title'),
            'category' => $request->validated('category'),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'description' => $request->validated('description'),
        ]);

        return back()->with('status', 'calendar-event-created');
    }

    public function destroy(Request $request, CalendarEvent $calendarEvent): RedirectResponse
    {
        $user = $request->user();

        abort_unless(
            $user && ($user->id === $calendarEvent->user_id || $user->isAdmin()),
            403,
        );

        $calendarEvent->delete();

        return back()->with('status', 'calendar-event-deleted');
    }
}
