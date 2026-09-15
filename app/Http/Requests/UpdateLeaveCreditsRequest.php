<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeaveCreditsRequest extends FormRequest
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
            'al_credits' => ['required', 'numeric', 'min:0', 'max:365', 'decimal:0,2'],
            'sl_credits' => ['required', 'numeric', 'min:0', 'max:365', 'decimal:0,2'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'al_credits.required' => 'Enter the AL balance.',
            'sl_credits.required' => 'Enter the SL balance.',
            'al_credits.min' => 'AL cannot be negative.',
            'sl_credits.min' => 'SL cannot be negative.',
            'al_credits.decimal' => 'AL must use up to two decimal places (e.g. 0.25).',
            'sl_credits.decimal' => 'SL must use up to two decimal places (e.g. 0.25).',
        ];
    }
}
