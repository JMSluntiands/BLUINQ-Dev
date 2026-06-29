<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDraftingRequestFormRequest extends FormRequest
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
            'your_name' => ['required', 'string', 'max:255'],
            'company_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255'],
            'service_engaging_ids' => ['required', 'array', 'min:1'],
            'service_engaging_ids.*' => [
                'integer',
                Rule::exists('service_engagings', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'site_address' => ['required', 'string', 'max:2000'],
            'site_owner_name' => ['required', 'string', 'max:255'],
            'max_building_area_sqm' => ['nullable', 'numeric', 'min:0'],
            'design_requirements' => ['nullable', 'string', 'max:2000'],
            'building_type_id' => [
                'required',
                'integer',
                Rule::exists('building_types', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'facade' => ['nullable', 'file', 'max:20480'],
            'ndis_sda' => ['sometimes', 'boolean'],
            'external_wall_construction_id' => [
                'nullable',
                'integer',
                Rule::exists('external_wall_constructions', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'roof_type_id' => [
                'nullable',
                'integer',
                Rule::exists('roof_types', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'ceiling_heights' => ['required', 'string', 'max:2000'],
            'first_floor_slab' => ['nullable', 'string', 'max:2000'],
            'additional_inclusions' => ['nullable', 'string', 'max:2000'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:20480'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $nullableIds = [
            'external_wall_construction_id',
            'roof_type_id',
        ];

        $normalized = [
            'ndis_sda' => filter_var($this->input('ndis_sda'), FILTER_VALIDATE_BOOLEAN),
        ];

        foreach ($nullableIds as $key) {
            $value = $this->input($key);
            $normalized[$key] = $value === '' || $value === null ? null : $value;
        }

        if ($this->input('max_building_area_sqm') === '') {
            $normalized['max_building_area_sqm'] = null;
        }

        $this->merge($normalized);
    }
}
