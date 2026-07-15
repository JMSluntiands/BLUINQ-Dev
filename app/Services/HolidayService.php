<?php

namespace App\Services;

use Carbon\Carbon;

class HolidayService
{
    /**
     * @var array<string, array{code: string, label: string}>
     */
    private const COUNTRIES = [
        'philippines' => [
            'code' => 'ph',
            'label' => 'Philippines',
        ],
        'singapore' => [
            'code' => 'sg',
            'label' => 'Singapore',
        ],
        'western_australia' => [
            'code' => 'wa',
            'label' => 'Western Australia',
        ],
    ];

    /**
     * @return array<string, list<array{name: string, country: string, country_label: string}>>
     */
    public function forRange(Carbon $rangeStart, Carbon $rangeEnd): array
    {
        $startKey = $rangeStart->toDateString();
        $endKey = $rangeEnd->toDateString();
        $holidays = [];

        foreach (config('holidays', []) as $country => $years) {
            $meta = self::COUNTRIES[$country] ?? [
                'code' => $country,
                'label' => ucwords(str_replace('_', ' ', $country)),
            ];

            foreach ($years as $yearHolidays) {
                foreach ($yearHolidays as $date => $name) {
                    if ($date < $startKey || $date > $endKey) {
                        continue;
                    }

                    $holidays[$date][] = [
                        'name' => $name,
                        'country' => $meta['code'],
                        'country_label' => $meta['label'],
                    ];
                }
            }
        }

        ksort($holidays);

        return $holidays;
    }

    /**
     * @return list<array{id: string, name: string, date: string, month: string, day: string, country: string, country_label: string}>
     */
    public function upcoming(int $limit = 5, ?Carbon $from = null): array
    {
        $from = ($from ?? Carbon::today())->startOfDay();
        $entries = [];

        foreach (config('holidays', []) as $country => $years) {
            $meta = self::COUNTRIES[$country] ?? [
                'code' => $country,
                'label' => ucwords(str_replace('_', ' ', $country)),
            ];

            foreach ($years as $yearHolidays) {
                foreach ($yearHolidays as $date => $name) {
                    $holidayDate = Carbon::parse($date)->startOfDay();

                    if ($holidayDate->lt($from)) {
                        continue;
                    }

                    $entries[] = [
                        'id' => "{$date}-{$meta['code']}-{$name}",
                        'name' => $name,
                        'date' => $holidayDate->format('M j'),
                        'month' => $holidayDate->format('M'),
                        'day' => $holidayDate->format('j'),
                        'country' => $meta['code'],
                        'country_label' => $meta['label'],
                        'sort_key' => $date,
                    ];
                }
            }
        }

        usort($entries, fn (array $a, array $b) => $a['sort_key'] <=> $b['sort_key']);

        return array_map(
            fn (array $entry) => array_diff_key($entry, ['sort_key' => true]),
            array_slice($entries, 0, $limit),
        );
    }
}
