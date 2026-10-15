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

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function regionChoices(): array
    {
        return collect(self::regionOptions())
            ->map(fn (string $label, string $value) => [
                'value' => $value,
                'label' => $value === 'western_australia' ? 'Australia (WA)' : $label,
            ])
            ->values()
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
            ->when($region !== null, fn ($query) => $query->where('region', $region))
            ->where(function ($query) use ($startKey, $endKey) {
                $query->whereBetween('holiday_date', [$startKey, $endKey])
                    ->orWhere('repeats_yearly', true);
            })
            ->orderBy('holiday_date')
            ->orderBy('name')
            ->get();

        foreach ($manual as $holiday) {
            foreach ($this->datesForHoliday($holiday, $startKey, $endKey) as $date) {
                $this->appendHoliday(
                    $holidays,
                    $date,
                    $holiday->name,
                    $this->countryMeta($holiday->region),
                    $holiday->id,
                );
            }
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

        $manual = PublicHoliday::query()
            ->where('region', $region)
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('holiday_date', [$startDate, $endDate])
                    ->orWhere('repeats_yearly', true);
            })
            ->get();

        foreach ($manual as $holiday) {
            foreach ($this->datesForHoliday($holiday, $startDate, $endDate) as $date) {
                $matches[$date] = true;
            }
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
        $years = [];

        foreach ($config as $countryYears) {
            foreach (array_keys((array) $countryYears) as $configuredYear) {
                $years[(int) $configuredYear] = true;
            }
        }

        $todayYear = (int) AppClock::today()->format('Y');
        for ($year = $todayYear - 1; $year <= $todayYear + 5; $year++) {
            $years[$year] = true;
        }

        foreach (PublicHoliday::query()->orderBy('holiday_date')->get() as $holiday) {
            if (! $holiday->repeats_yearly) {
                $date = $holiday->holiday_date->toDateString();
                $year = (int) $holiday->holiday_date->format('Y');
                $config[$holiday->region][$year][$date] = $holiday->name;

                continue;
            }

            foreach (array_keys($years) as $year) {
                $date = PublicHoliday::occurrenceInYear($holiday->holiday_date, (int) $year);
                if ($date === null) {
                    continue;
                }

                $config[$holiday->region][$year][$date] = $holiday->name;
            }
        }

        return $config;
    }

    /**
     * Built-in holidays plus ones added from HR, for one year.
     *
     * @return list<array{key: string, id: int|null, region: string, country: string, country_label: string, date: string, display_date: string, name: string, manual: bool}>
     */
    public function manageList(int $year): array
    {
        $rows = [];
        $start = sprintf('%04d-01-01', $year);
        $end = sprintf('%04d-12-31', $year);

        foreach (config('holidays', []) as $country => $years) {
            $meta = $this->countryMeta((string) $country);

            foreach ((array) ($years[$year] ?? []) as $date => $name) {
                $rows[] = $this->manageRow(
                    'listed-'.$meta['code'].'-'.$date.'-'.$name,
                    null,
                    (string) $country,
                    $meta,
                    (string) $date,
                    (string) $name,
                    false,
                    false,
                );
            }
        }

        $manual = PublicHoliday::query()
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('holiday_date', [$start, $end])
                    ->orWhere('repeats_yearly', true);
            })
            ->orderBy('holiday_date')
            ->orderBy('name')
            ->get();

        foreach ($manual as $holiday) {
            $date = $holiday->repeats_yearly
                ? PublicHoliday::occurrenceInYear($holiday->holiday_date, $year)
                : $holiday->holiday_date->toDateString();

            if ($date === null || $date < $start || $date > $end) {
                continue;
            }

            $alreadyListed = collect($rows)->contains(
                fn (array $row) => $row['region'] === $holiday->region
                    && $row['date'] === $date
                    && strcasecmp($row['name'], $holiday->name) === 0,
            );

            if ($alreadyListed) {
                continue;
            }

            $rows[] = $this->manageRow(
                'manual-'.$holiday->id.'-'.$year,
                $holiday->id,
                $holiday->region,
                $this->countryMeta($holiday->region),
                $date,
                $holiday->name,
                true,
                $holiday->repeats_yearly,
            );
        }

        usort(
            $rows,
            fn (array $a, array $b) => [$a['date'], $a['country_label'], $a['name']]
                <=> [$b['date'], $b['country_label'], $b['name']],
        );

        return $rows;
    }

    /**
     * @param  array{code: string, label: string}  $meta
     * @return array{key: string, id: int|null, region: string, country: string, country_label: string, date: string, display_date: string, name: string, manual: bool, repeats_yearly: bool}
     */
    private function manageRow(
        string $key,
        ?int $id,
        string $region,
        array $meta,
        string $date,
        string $name,
        bool $manual,
        bool $repeatsYearly,
    ): array {
        return [
            'key' => $key,
            'id' => $id,
            'region' => $region,
            'country' => $meta['code'],
            'country_label' => $region === 'western_australia' ? 'Australia (WA)' : $meta['label'],
            'date' => $date,
            'display_date' => Carbon::parse($date)->format('M j, Y'),
            'name' => $name,
            'manual' => $manual,
            'repeats_yearly' => $repeatsYearly,
        ];
    }

    /**
     * @return list<string>
     */
    private function datesForHoliday(PublicHoliday $holiday, string $start, string $end): array
    {
        if (! $holiday->repeats_yearly) {
            $date = $holiday->holiday_date->toDateString();

            return ($date >= $start && $date <= $end) ? [$date] : [];
        }

        $dates = [];
        $startYear = (int) substr($start, 0, 4);
        $endYear = (int) substr($end, 0, 4);

        for ($year = $startYear; $year <= $endYear; $year++) {
            $date = PublicHoliday::occurrenceInYear($holiday->holiday_date, $year);
            if ($date !== null && $date >= $start && $date <= $end) {
                $dates[] = $date;
            }
        }

        return $dates;
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
            ->where(function ($query) use ($from) {
                $query->whereDate('holiday_date', '>=', $from->toDateString())
                    ->orWhere('repeats_yearly', true);
            })
            ->orderBy('holiday_date')
            ->orderBy('name')
            ->get();

        foreach ($manual as $holiday) {
            $date = $holiday->holiday_date->toDateString();

            if ($holiday->repeats_yearly) {
                $date = null;
                $year = (int) $from->format('Y');

                for ($offset = 0; $offset <= 8; $offset++) {
                    $candidate = PublicHoliday::occurrenceInYear($holiday->holiday_date, $year + $offset);
                    if ($candidate !== null && $candidate >= $from->toDateString()) {
                        $date = $candidate;
                        break;
                    }
                }
            }

            if ($date === null) {
                continue;
            }

            $this->appendUpcoming(
                $entries,
                $date,
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
