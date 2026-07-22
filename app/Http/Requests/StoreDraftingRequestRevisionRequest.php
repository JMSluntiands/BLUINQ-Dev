<?php

namespace App\Http\Requests;

use App\Models\DraftingRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDraftingRequestRevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasPermission('job.drafting.revision.add');
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('checker_user_id') === '') {
            $this->merge(['checker_user_id' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:64', 'regex:/^\d{5}(-\d{2})?$/'],
            'log_date' => ['required', 'date'],
            'category' => [
                'required',
                'string',
                'max:255',
                Rule::exists('crm_categories', 'name')->where(
                    fn ($query) => $query
                        ->whereNull('archived_at')
                        ->where('status', 'active'),
                ),
            ],
            'drafter_user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(
                    fn ($query) => $query->whereNull('archived_at'),
                ),
            ],
            'checker_user_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(
                    fn ($query) => $query->whereNull('archived_at'),
                ),
            ],
            'drafting_hours' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'checking_hours' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'status' => ['required', 'string', Rule::in(DraftingRequest::statusValues())],
            'area_size' => ['nullable', 'string', 'max:64'],
            'submitted_date' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => 'Enter a job number.',
            'code.regex' => 'Use format YY001 or YY001-01 (e.g. 26001 or 26001-01).',
            'log_date.required' => 'Select a date in.',
            'category.required' => 'Select a category.',
            'category.exists' => 'Select a valid category.',
            'drafter_user_id.required' => 'Select a drafter.',
            'drafter_user_id.exists' => 'Select a valid drafter.',
            'checker_user_id.exists' => 'Select a valid checker.',
        ];
    }
}
