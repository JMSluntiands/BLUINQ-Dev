<?php

namespace App\Services;

use App\Models\CalendarEvent;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class CalendarEventService
{
    /**
     * @return array<string, list<array<string, mixed>>>
     */
    public function forRange(Carbon $rangeStart, Carbon $rangeEnd): array
    {
        $events = CalendarEvent::query()
            ->with('user:id,name')
            ->whereDate('start_date', '<=', $rangeEnd)
            ->whereDate('end_date', '>=', $rangeStart)
            ->orderBy('start_date')
            ->orderBy('title')
            ->get();

        $map = [];

        foreach ($events as $event) {
            $start = $event->start_date->copy()->max($rangeStart->copy()->startOfDay());
            $end = $event->end_date->copy()->min($rangeEnd->copy()->startOfDay());

            foreach (CarbonPeriod::create($start, $end) as $day) {
                $key = $day->toDateString();

                $map[$key][] = [
                    'id' => $event->id,
                    'title' => $event->title,
                    'category' => $event->category,
                    'category_label' => $event->categoryLabel(),
                    'description' => $event->description,
                    'created_by' => $event->user->name,
                    'created_by_id' => $event->user_id,
                ];
            }
        }

        ksort($map);

        return $map;
    }
}
