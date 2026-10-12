<?php

namespace App\Services;

use App\Models\PublicHoliday;
use App\Support\AppClock;
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
     * @return list<string>
     */
    public static function regionKeys(): array
    {
        return array_keys(self::COUNTRIES);
    }

    /**
     * @return array<string, string>
     */
    public static function regionOptions(): array
    {
        return collect(self::COUNTRIES)
            ->mapWithKeys(fn (array $meta, string $key) => [$key => $meta['label']])
            ->all();
    }

    public static function normalizeRegion(?string $region): ?string
    {
        return in_array($region, self::regionKeys(), true) ? $region : null;
    }

    /**
     * @return array<string, list<array{name: string, country: string, country_label: string}>>
     */
    public function forRange(Carbon $rangeStart, Carbon $rangeEnd, ?string $region = null): array
    {
        $startKey = $rangeStart->toDateString();
        $endKey = $rangeEnd->toDateString();
        $holidays = [];
        $region = self::normalizeRegion($region);

        foreach (config('holidays', []) as $country => $years) {
            if ($region !== null && $country !== $region) {
                continue;
            }

            $meta = $this->countryMeta($country);

            foreach ($years as $yearHolidays) {
                foreach ($yearHolidays as $date => $name) {
                    if ($date < $startKey || $date > $endKey) {
                        continue;
                    }

                    $this->appendHoliday($holidays, (string) $date, (string) $name, $meta);
                }
            }
        }

        $manual = PublicHoliday::query()
            ->whereBetween('holiday_date', [$startKey, $endKey])
            ->when($region !== null, fn ($query) => $query->where('region', $region))
            ->orderBy('holiday_date')
            ->orderBy('name')
            ->get();

        foreach ($manual as $holiday) {
            $this->appendHoliday(
                $holidays,
                $holiday->holiday_date->toDateString(),
                $holiday->name,
                $this->countryMeta($holiday->region),
                $holiday->id,
            );
        }

        ksort($holidays);

        return $holidays;
    }

    /**
     * @return array<string, true>
     */
    public function datesInRange(string $startDate, string $endDate, ?string $region): array
    {
        $region = self::normalizeRegion($region);
        if ($region === null) {
            return [];
        }

        $matches = [];

        foreach ((array) config("holidays.{$region}", []) as $yearHolidays) {
            foreach ((array) $yearHolidays as $date => $name) {
                if ($date >= $startDate && $date <= $endDate) {
                    $matches[$date] = true;
                }
            }
        }

        $manualDates = PublicHoliday::query()
            ->where('region', $region)
            ->whereBetween('holiday_date', [$startDate, $endDate])
            ->pluck('holiday_date');

        foreach ($manualDates as $date) {
            $key = $date instanceof Carbon ? $date->toDateString() : (string) $date;

            $matches[$key] = true;
        }

        return $matches;
    }

    /**
     * Config holidays plus holidays added from the calendar.
     *
     * @return array<string, array<int, array<string, string>>>
     */
    public function clientConfig(): array
    {
        $config = config('holidays', []);

        foreach (PublicHoliday::query()->orderBy('holiday_date')->get() as $holiday) {
            $date = $holiday->holiday_date->toDateString();
            $year = (int) $holiday->holiday_date->format('Y');
            $config[$holiday->region][$year][$date] = $holiday->name;
        }

        return $config;
    }

    /**
     * @return list<array{id: string, name: string, date: string, month: string, day: string, country: string, country_label: string}>
     */
    public function upcoming(int $limit = 5, ?Carbon $from = null, ?string $region = null): array
    {
        $from = ($from ?? AppClock::today())->startOfDay();
        $entries = [];
        $region = self::normalizeRegion($region);

        foreach (config('holidays', []) as $country => $years) {
            if ($region !== null && $country !== $region) {
                continue;
            }

            $meta = $this->countryMeta($country);

            foreach ($years as $yearHolidays) {
                foreach ($yearHolidays as $date => $name) {
                    $this->appendUpcoming($entries, (string) $date, (string) $name, $meta, $from);
                }
            }
        }

        $manual = PublicHoliday::query()
            ->when($region !== null, fn ($query) => $query->where('region', $region))
            ->whereDate('holiday_date', '>=', $from->toDateString())
            ->orderBy('holiday_date')
            ->orderBy('name')
            ->get();

        foreach ($manual as $holiday) {
            $this->appendUpcoming(
                $entries,
                $holiday->holiday_date->toDateString(),
                $holiday->name,
                $this->countryMeta($holiday->region),
                $from,
            );
        }

        usort($entries, fn (array $a, array $b) => $a['sort_key'] <=> $b['sort_key']);

        return array_map(
            fn (array $entry) => array_diff_key($entry, ['sort_key' => true]),
            array_slice($entries, 0, $limit),
        );
    }

    /**
     * @return array{code: string, label: string}
     */
    private function countryMeta(string $country): array
    {
        return self::COUNTRIES[$country] ?? [
            'code' => $country,
            'label' => ucwords(str_replace('_', ' ', $country)),
        ];
    }

    /**
     * @param  array<string, list<array{id: int|null, name: string, country: string, country_label: string, manual: bool}>>  $holidays
     * @param  array{code: string, label: string}  $meta
     */
    private function appendHoliday(array &$holidays, string $date, string $name, array $meta, ?int $id = null): void
    {
        foreach ($holidays[$date] ?? [] as $existing) {
            if ($existing['country'] === $meta['code'] && strcasecmp($existing['name'], $name) === 0) {
                return;
            }
        }

        $holidays[$date][] = [
            'id' => $id,
            'name' => $name,
            'country' => $meta['code'],
            'country_label' => $meta['label'],
            'manual' => $id !== null,
        ];
    }

    /**
     * @param  list<array{id: string, name: string, date: string, month: string, day: string, country: string, country_label: string, sort_key: string}>  $entries
     * @param  array{code: string, label: string}  $meta
     */
    private function appendUpcoming(array &$entries, string $date, string $name, array $meta, Carbon $from): void
    {
        $holidayDate = Carbon::parse($date)->startOfDay();

        if ($holidayDate->lt($from)) {
            return;
        }

        $id = "{$date}-{$meta['code']}-{$name}";

        foreach ($entries as $existing) {
            if ($existing['id'] === $id) {
                return;
            }
        }

        $entries[] = [
            'id' => $id,
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
