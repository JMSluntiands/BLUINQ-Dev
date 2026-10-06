<?php

namespace App\Http\Requests;

use App\Models\ArrivalInputFile;
use App\Models\BuildingType;
use App\Models\CrmCategory;
use App\Models\Deliverable;
use App\Models\LevelOfDifficulty;
use App\Models\ScopeOfWork;
use Illuminate\Foundation\Http\FormRequest;

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
                ArrivalInputFile::selectableExistsRule(),
            ],
            'crm_category_id' => [
                'required',
                'integer',
                CrmCategory::selectableExistsRule(),
            ],
            'level_of_difficulty_id' => [
                'required',
                'integer',
                LevelOfDifficulty::selectableExistsRule(),
            ],
            'building_type_id' => [
                'required',
                'integer',
                BuildingType::selectableExistsRule(),
            ],
            'scope_of_work_id' => [
                'required',
                'integer',
                ScopeOfWork::selectableExistsRule(),
            ],
            'deliverable_id' => [
                'required',
                'integer',
                Deliverable::selectableExistsRule(),
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
