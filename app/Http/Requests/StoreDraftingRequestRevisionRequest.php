<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDraftingRequestRevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasPermission('job.drafting.revision.add');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:64'],
            'log_date' => ['required', 'date'],
            'category' => ['required', 'string', 'max:64'],
            'drafter_user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(
                    fn ($query) => $query->whereNull('archived_at'),
                ),
            ],
            'hours' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'submitted_date' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => 'Enter a revision code.',
            'log_date.required' => 'Select a log date.',
            'category.required' => 'Enter a category.',
            'drafter_user_id.required' => 'Select a user.',
            'drafter_user_id.exists' => 'Select a valid user.',
        ];
    }
}
