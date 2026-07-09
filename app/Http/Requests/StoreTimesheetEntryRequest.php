<?php

namespace App\Http\Requests;

use App\Models\TimesheetEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTimesheetEntryRequest extends FormRequest
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
        return [
            'week_start' => ['required', 'date'],
            'task_type' => [
                'required',
                'string',
                Rule::in([
                    TimesheetEntry::TASK_REVISION,
                    TimesheetEntry::TASK_ADMIN,
                    TimesheetEntry::TASK_TRAINING,
                    TimesheetEntry::TASK_MEETING,
                ]),
            ],
            'revision_id' => [
                'nullable',
                'integer',
                'exists:drafting_request_revisions,id',
                'required_if:task_type,'.TimesheetEntry::TASK_REVISION,
            ],
        ];
    }
}
