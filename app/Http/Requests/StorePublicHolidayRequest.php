<?php

namespace App\Http\Requests;

use App\Models\PublicHoliday;
use App\Services\HolidayService;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePublicHolidayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('leave.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'holidays' => ['required', 'array', 'min:1', 'max:30'],
            'holidays.*.region' => ['required', Rule::in(HolidayService::regionKeys())],
            'holidays.*.holiday_date' => ['required', 'date'],
            'holidays.*.name' => ['required', 'string', 'max:255'],
            'holidays.*.repeats_yearly' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var list<array{region: string, holiday_date: string, name: string, repeats_yearly: bool}> $rows */
            $rows = $this->input('holidays', []);
            $seen = [];

            foreach ($rows as $index => $row) {
                $this->validateHolidayRow($validator, $index, $row, $seen);
            }
        });
    }

    /**
     * @param  array{region: string, holiday_date: string, name: string, repeats_yearly?: bool}  $row
     * @param  array<string, true>  $seen
     */
    private function validateHolidayRow(Validator $validator, int $index, array $row, array &$seen): void
    {
        $region = (string) $row['region'];
        $parsed = Carbon::parse((string) $row['holiday_date']);
        $date = $parsed->toDateString();
        $year = (int) $parsed->format('Y');
        $name = trim((string) $row['name']);
        $repeats = (bool) ($row['repeats_yearly'] ?? false);
        $field = "holidays.{$index}.name";
        $identity = strtolower($region.'|'.$date.'|'.$name);

        if (isset($seen[$identity])) {
            $validator->errors()->add($field, 'This holiday is already in the list.');

            return;
        }

        $seen[$identity] = true;
        $listed = config("holidays.{$region}.{$year}.{$date}");

        if (is_string($listed) && strcasecmp($listed, $name) === 0) {
            $validator->errors()->add($field, 'This holiday is already on the calendar.');

            return;
        }

        $exact = PublicHoliday::query()
            ->where('region', $region)
            ->whereDate('holiday_date', $date)
            ->where('name', $name)
            ->exists();

        if ($exact) {
            $validator->errors()->add($field, 'This holiday is already on the calendar.');

            return;
        }

        if (! $repeats) {
            return;
        }

        $monthDay = $parsed->format('m-d');
        $yearlyKey = strtolower($region.'|'.$monthDay.'|'.$name.'|yearly');

        if (isset($seen[$yearlyKey])) {
            $validator->errors()->add($field, 'This holiday is already in the list.');

            return;
        }

        $seen[$yearlyKey] = true;

        foreach ((array) config("holidays.{$region}", []) as $yearHolidays) {
            foreach ((array) $yearHolidays as $listedDate => $listedName) {
                if (substr((string) $listedDate, 5) === $monthDay && strcasecmp((string) $listedName, $name) === 0) {
                    $validator->errors()->add($field, 'This holiday is already on the calendar.');

                    return;
                }
            }
        }

        $alreadyYearly = PublicHoliday::query()
            ->where('region', $region)
            ->where('name', $name)
            ->where('repeats_yearly', true)
            ->whereMonth('holiday_date', (int) $parsed->format('n'))
            ->whereDay('holiday_date', (int) $parsed->format('j'))
            ->exists();

        if ($alreadyYearly) {
            $validator->errors()->add($field, 'This holiday is already on the calendar.');
        }
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'holidays.required' => 'Add at least one holiday.',
            'holidays.*.region.required' => 'Please select a country.',
            'holidays.*.holiday_date.required' => 'Please select a date.',
            'holidays.*.name.required' => 'Please enter the holiday name.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $rows = $this->input('holidays');

        if (! is_array($rows)) {
            $rows = [[
                'region' => $this->input('region'),
                'holiday_date' => $this->input('holiday_date'),
                'name' => $this->input('name'),
                'repeats_yearly' => $this->boolean('repeats_yearly'),
            ]];
        }

        $this->merge([
            'holidays' => collect($rows)->map(function ($row) {
                $row = is_array($row) ? $row : [];

                return [
                    'region' => $row['region'] ?? null,
                    'holiday_date' => $row['holiday_date'] ?? null,
                    'name' => trim((string) ($row['name'] ?? '')),
                    'repeats_yearly' => filter_var($row['repeats_yearly'] ?? false, FILTER_VALIDATE_BOOLEAN),
                ];
            })->values()->all(),
        ]);
    }
}
