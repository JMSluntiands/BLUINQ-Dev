<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCrmQuoteFormRequest extends FormRequest
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
            'requested_at' => ['required', 'date'],
            'client_company_name' => ['required', 'string', 'max:255'],
            'project_job_number' => ['nullable', 'string', 'max:255'],
            'site_address' => ['required', 'string', 'max:2000'],
            'site_owner_name' => ['nullable', 'string', 'max:255'],
            'arrival_input_file_id' => [
                'required',
                'integer',
                Rule::exists('arrival_input_files', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'crm_category_id' => [
                'required',
                'integer',
                Rule::exists('crm_categories', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'level_of_difficulty_id' => [
                'required',
                'integer',
                Rule::exists('level_of_difficulties', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'building_type_id' => [
                'required',
                'integer',
                Rule::exists('building_types', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'scope_of_work_id' => [
                'required',
                'integer',
                Rule::exists('scope_of_works', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'deliverable_id' => [
                'required',
                'integer',
                Rule::exists('deliverables', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'building_area_size' => ['required', 'string', 'max:2000'],
            'estimated_time_allocation' => ['required', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $nullableIds = [
            'arrival_input_file_id',
            'crm_category_id',
            'level_of_difficulty_id',
            'building_type_id',
            'scope_of_work_id',
            'deliverable_id',
        ];

        $normalized = [];

        foreach ($nullableIds as $key) {
            $value = $this->input($key);
            $normalized[$key] = $value === '' || $value === null ? null : $value;
        }

        $this->merge($normalized);
    }
}
