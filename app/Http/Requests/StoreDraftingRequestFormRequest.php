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
            'requested_at' => ['nullable', 'date'],
            'your_name' => ['required', 'string', 'max:255'],
            'client_id' => [
                'required',
                'integer',
                Rule::exists('clients', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'company_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'service_engaging_ids' => ['required', 'array', 'min:1'],
            'service_engaging_ids.*' => [
                'integer',
                Rule::exists('service_engagings', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'site_address' => ['required', 'string', 'max:2000'],
            'council_shire' => ['nullable', 'string', 'max:255'],
            'site_owner_name' => ['required', 'string', 'max:255'],
            'max_building_area_sqm' => ['nullable', 'numeric', 'min:0'],
            'building_type_id' => [
                'nullable',
                'integer',
                Rule::exists('building_types', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'storey_level_id' => [
                'required',
                'integer',
                Rule::exists('storey_levels', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'building_class_id' => [
                'required',
                'integer',
                Rule::exists('building_classes', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'zoning' => ['nullable', 'string', 'max:255'],
            'sda_type_ids' => ['nullable', 'array'],
            'sda_type_ids.*' => [
                'integer',
                Rule::exists('sda_types', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
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
            'ceiling_heights' => ['nullable', 'string', 'max:2000'],
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
            'client_id',
            'building_class_id',
            'building_type_id',
            'storey_level_id',
        ];

        $normalized = [
            'ndis_sda' => collect($this->input('sda_type_ids', []))
                ->filter(fn ($id) => $id !== '' && $id !== null)
                ->isNotEmpty(),
        ];

        $requestedAt = $this->input('requested_at');
        if ($requestedAt === '' || $requestedAt === null) {
            $normalized['requested_at'] = now(config('app.timezone'))
                ->seconds(0)
                ->format('Y-m-d H:i:s');
        }

        foreach ($nullableIds as $key) {
            $value = $this->input($key);
            $normalized[$key] = $value === '' || $value === null ? null : $value;
        }

        if ($this->input('max_building_area_sqm') === '') {
            $normalized['max_building_area_sqm'] = null;
        }

        if ($this->input('zoning') === '') {
            $normalized['zoning'] = null;
        }

        if ($this->input('phone') === '') {
            $normalized['phone'] = null;
        }

        if ($this->input('email') === '') {
            $normalized['email'] = null;
        }

        if ($this->input('council_shire') === '') {
            $normalized['council_shire'] = null;
        }

        foreach (['ceiling_heights', 'first_floor_slab', 'additional_inclusions'] as $key) {
            if ($this->input($key) === '' || $this->input($key) === null) {
                $normalized[$key] = null;
            }
        }

        $sdaIds = $this->input('sda_type_ids', []);
        if (! is_array($sdaIds)) {
            $sdaIds = [];
        }
        $normalized['sda_type_ids'] = array_values(array_filter(
            $sdaIds,
            fn ($id) => $id !== '' && $id !== null,
        ));

        $this->merge($normalized);
    }
}
