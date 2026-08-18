<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTimesheetApprovalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canApproveTimesheetEntries() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'approval_status' => [
                'required',
                'string',
                Rule::in(['approved', 'declined', 'pending']),
            ],
        ];
    }
}
