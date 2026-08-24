<?php

namespace App\Http\Requests;

use App\Models\CrmCategory;
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
        foreach (['checker_user_id', 'drafter_user_id', 'drafting_hours', 'checking_hours', 'area_size', 'submitted_date', 'link'] as $key) {
            if ($this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $categoryCodes = CrmCategory::query()
            ->active()
            ->where('status', 'active')
            ->orderBy('code')
            ->get(['code', 'name'])
            ->flatMap(fn (CrmCategory $row) => array_filter([
                $row->code,
                $row->name,
            ]))
            ->all();

        return [
            'code' => ['required', 'string', 'max:64', 'regex:/^.+-\d{2}$/'],
            'link' => ['nullable', 'string', 'max:2048', 'url'],
            'log_date' => ['required', 'date'],
            'category' => ['required', 'string', 'max:255', Rule::in(array_values(array_unique($categoryCodes)))],
            'drafter_user_id' => [
                'nullable',
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
            'code.required' => 'Enter a revision number.',
            'code.regex' => 'Use the last number plus -01, -02, etc. (e.g. 1111111-02).',
            'log_date.required' => 'Select a date in.',
            'category.required' => 'Select a category.',
            'category.in' => 'Select a valid category.',
            'drafter_user_id.exists' => 'Select a valid drafter.',
            'checker_user_id.exists' => 'Select a valid checker.',
        ];
    }
}
