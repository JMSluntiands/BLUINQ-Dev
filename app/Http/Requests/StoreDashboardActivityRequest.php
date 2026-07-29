<?php

namespace App\Http\Requests;

use App\Models\TimesheetEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDashboardActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isProjectScoped = TimesheetEntry::activityRequiresProject(
            (string) $this->input('activity'),
        );

        return [
            'activity' => [
                'required',
                'string',
                Rule::in(array_keys(TimesheetEntry::ACTIVITY_TASK_LABELS)),
            ],
            'project_id' => [
                Rule::requiredIf($isProjectScoped),
                'nullable',
                'integer',
                'exists:drafting_requests,id',
            ],
            'date' => ['required', 'date'],
            'hours' => ['required', 'integer', 'min:0', 'max:24'],
            'minutes' => ['required', 'integer', 'min:0', 'max:59'],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('project_id') === '' || $this->input('project_id') === null) {
            $this->merge(['project_id' => null]);
        }
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $hours = (int) $this->input('hours', 0);
            $minutes = (int) $this->input('minutes', 0);

            if ($hours === 0 && $minutes === 0) {
                $validator->errors()->add('hours', 'Enter a duration greater than zero.');
            }
        });
    }
}
