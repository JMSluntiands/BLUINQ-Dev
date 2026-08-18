<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveCreditsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('leave.credits.edit') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'amount' => ['required', 'numeric', 'min:0.5', 'max:365', 'multiple_of:0.5'],
            'bucket' => ['required', Rule::in(['al', 'sl'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'Please select an employee.',
            'amount.required' => 'Please enter the number of credits to add.',
            'amount.min' => 'Credits must be at least 0.5.',
            'amount.multiple_of' => 'Credits must be in 0.5 increments.',
            'bucket.required' => 'Please choose AL or SL.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('bucket')) {
            $this->merge(['bucket' => 'al']);
        }
    }
}
