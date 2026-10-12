<?php

namespace App\Http\Requests;

use App\Services\HolidayService;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePublicHolidayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'region' => ['required', Rule::in(HolidayService::regionKeys())],
            'holiday_date' => ['required', 'date'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('public_holidays', 'name')->where(function ($query) {
                    $date = $this->input('holiday_date');

                    return $query
                        ->where('region', $this->input('region'))
                        ->where('holiday_date', $date);
                }),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $region = (string) $this->input('region');
            $date = Carbon::parse((string) $this->input('holiday_date'))->toDateString();
            $year = (int) substr($date, 0, 4);
            $name = trim((string) $this->input('name'));
            $listed = config("holidays.{$region}.{$year}.{$date}");

            if (is_string($listed) && strcasecmp($listed, $name) === 0) {
                $validator->errors()->add('name', 'This holiday is already on the calendar.');
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'region.required' => 'Please select a country.',
            'holiday_date.required' => 'Please select a date.',
            'name.required' => 'Please enter the holiday name.',
            'name.unique' => 'This holiday is already on the calendar.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => trim((string) $this->input('name')),
            ]);
        }
    }
}
