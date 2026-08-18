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
            'lead_number' => [
                Rule::requiredIf(fn () => $this->user() !== null),
                'nullable',
                'string',
                'max:32',
                'regex:/^[A-Za-z0-9\-]+$/',
                Rule::unique('drafting_requests', 'lead_number')->ignore(
                    $this->route('draftingRequest')?->id,
                ),
            ],
            'your_name' => ['required', 'string', 'max:255'],
            'client_id' => [
                'required',
                'integer',
                Rule::exists('clients', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'client_contact_id' => [
                'required',
                'integer',
                Rule::exists('client_contacts', 'id')->where(
                    function ($q) {
                        $clientId = $this->input('client_id');
                        if ($clientId) {
                            $q->where('client_id', $clientId);
                        }
                    },
                ),
            ],
            'manager_user_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'company_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'service_engaging_ids' => ['nullable', 'array'],
            'service_engaging_ids.*' => [
                'integer',
                Rule::exists('service_engagings', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'crm_category_ids' => ['required', 'array', 'min:1'],
            'crm_category_ids.*' => [
                'integer',
                Rule::exists('crm_categories', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'crm_category_id' => [
                'nullable',
                'integer',
                Rule::exists('crm_categories', 'id')->where(
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

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'lead_number.required' => 'Enter a lead number.',
            'lead_number.unique' => 'That lead number is already in use.',
            'lead_number.regex' => 'Lead number may only contain letters, numbers, and hyphens.',
            'crm_category_ids.required' => 'Select at least one category.',
            'crm_category_ids.min' => 'Select at least one category.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $nullableIds = [
            'external_wall_construction_id',
            'roof_type_id',
            'client_id',
            'client_contact_id',
            'manager_user_id',
            'building_class_id',
            'building_type_id',
            'storey_level_id',
            'crm_category_id',
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

        $leadNumber = trim((string) $this->input('lead_number', ''));
        $normalized['lead_number'] = $leadNumber === '' ? null : $leadNumber;

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

        $serviceIds = $this->input('service_engaging_ids', []);
        if (! is_array($serviceIds)) {
            $serviceIds = [];
        }
        $normalized['service_engaging_ids'] = array_values(array_filter(
            $serviceIds,
            fn ($id) => $id !== '' && $id !== null,
        ));

        $categoryIds = $this->input('crm_category_ids', []);
        if (! is_array($categoryIds)) {
            // Backward compatible: single select field posted as crm_category_id.
            $single = $this->input('crm_category_id');
            $categoryIds = $single === '' || $single === null ? [] : [$single];
        }
        $normalized['crm_category_ids'] = array_values(array_map(
            'intval',
            array_filter(
                $categoryIds,
                fn ($id) => $id !== '' && $id !== null,
            ),
        ));
        $normalized['crm_category_id'] = $normalized['crm_category_ids'][0] ?? null;

        $this->merge($normalized);
    }
}
