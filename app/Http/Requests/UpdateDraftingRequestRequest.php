<?php

namespace App\Http\Requests;

use App\Models\DraftingRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDraftingRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        /** @var DraftingRequest|null $draftingRequest */
        $draftingRequest = $this->route('draftingRequest');

        if ($draftingRequest === null || $draftingRequest->isArchived()) {
            return false;
        }

        $canViewApm = $draftingRequest->workflow_stage === DraftingRequest::STAGE_APM
            && $user->hasPermission('job.drafting.view');
        $canViewMasterlist = $draftingRequest->workflow_stage === DraftingRequest::STAGE_MASTERLIST
            && $user->hasPermission('job.drafting-request.view');

        if (! $canViewApm && ! $canViewMasterlist) {
            return false;
        }

        if ($this->input('section') === 'building_area') {
            return $user->hasPermission('job.drafting.building-area.edit')
                || $canViewMasterlist;
        }

        return $user->hasPermission('job.drafting.job-details.edit')
            || $canViewMasterlist;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $section = $this->input('section');

        return match ($section) {
            'client' => [
                'section' => ['required', 'string', 'in:client'],
                'your_name' => ['required', 'string', 'max:255'],
                'company_name' => ['required', 'string', 'max:255'],
                'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255'],
            ],
            'job' => [
                'section' => ['required', 'string', 'in:job'],
                'lead_number' => [
                    'required',
                    'string',
                    'max:32',
                    'regex:/^[A-Za-z0-9\-]+$/',
                    Rule::unique('drafting_requests', 'lead_number')->ignore(
                        $this->route('draftingRequest')?->id,
                    ),
                ],
                'status' => ['required', 'string', Rule::in(DraftingRequest::statusValues())],
                'client_id' => [
                    'nullable',
                    'integer',
                    Rule::exists('clients', 'id')->where(
                        fn ($q) => $q->whereNull('archived_at'),
                    ),
                ],
                'client_contact_id' => [
                    'nullable',
                    'integer',
                    Rule::exists('client_contacts', 'id')->where(
                        fn ($q) => $q->whereNull('archived_at'),
                    ),
                ],
                'manager_user_id' => [
                    'nullable',
                    'integer',
                    Rule::exists('users', 'id')->where(
                        fn ($q) => $q->whereNull('archived_at'),
                    ),
                ],
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
                'zoning' => ['nullable', 'string', 'max:255'],
                'site_address' => ['required', 'string', 'max:2000'],
                'site_owner_name' => ['nullable', 'string', 'max:255'],
                'service_engaging_ids' => ['nullable', 'array'],
                'service_engaging_ids.*' => [
                    'integer',
                    Rule::exists('service_engagings', 'id')->where(
                        fn ($q) => $q->whereNull('archived_at'),
                    ),
                ],
                'ndis_sda' => ['sometimes', 'boolean'],
                'unit_development_count' => ['nullable', 'integer', 'min:0', 'max:50'],
                'units' => ['nullable', 'array', 'max:50'],
                'units.*.unit_number' => ['required_with:units', 'integer', 'min:1', 'max:50'],
                'units.*.house_type' => ['nullable', 'string', 'max:255'],
                'units.*.area_sqm' => ['nullable', 'numeric', 'min:0'],
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
                'design_requirements' => ['nullable', 'string', 'max:2000'],
                'additional_inclusions' => ['nullable', 'string', 'max:2000'],
            ],
            'drawing_checklist' => [
                'section' => ['required', 'string', 'in:drawing_checklist'],
                'items' => ['required', 'array'],
                'items.*.key' => ['required', 'string', 'max:64'],
                'items.*.checked' => ['required', 'boolean'],
                'items.*.custom_type' => ['nullable', 'string', 'max:120'],
            ],
            'drawing_checklist_reset' => [
                'section' => ['required', 'string', 'in:drawing_checklist_reset'],
            ],
            'building' => [
                'section' => ['required', 'string', 'in:building'],
                'site_owner_name' => ['required', 'string', 'max:255'],
                'max_building_area_sqm' => ['nullable', 'numeric', 'min:0'],
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
            ],
            'notes' => [
                'section' => ['required', 'string', 'in:notes'],
                'design_requirements' => ['nullable', 'string', 'max:2000'],
                'additional_inclusions' => ['nullable', 'string', 'max:2000'],
            ],
            'building_area' => [
                'section' => ['required', 'string', 'in:building_area'],
                'max_building_area_sqm' => ['nullable', 'numeric', 'min:0'],
            ],
            default => [
                'section' => ['required', 'string', 'in:client,job,building,notes,building_area,drawing_checklist,drawing_checklist_reset'],
            ],
        };
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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->input('section') !== 'drawing_checklist') {
                return;
            }

            foreach ($this->input('items', []) as $index => $item) {
                if (($item['key'] ?? '') !== 'others' || empty($item['checked'])) {
                    continue;
                }

                if (trim((string) ($item['custom_type'] ?? '')) === '') {
                    $validator->errors()->add(
                        "items.{$index}.custom_type",
                        'Enter a custom drawing type.',
                    );
                }
            }
        });
    }

    protected function prepareForValidation(): void
    {
        $section = $this->input('section');

        if ($section === 'job') {
            if ($this->has('lead_number')) {
                $leadNumber = trim((string) $this->input('lead_number', ''));
                $this->merge([
                    'lead_number' => $leadNumber === '' ? null : $leadNumber,
                ]);
            }

            $this->merge([
                'ndis_sda' => filter_var($this->input('ndis_sda'), FILTER_VALIDATE_BOOLEAN),
            ]);

            if ($this->has('unit_development_count')) {
                $count = $this->input('unit_development_count');
                $this->merge([
                    'unit_development_count' => $count === '' || $count === null
                        ? 0
                        : (int) $count,
                ]);
            }

            foreach (['external_wall_construction_id', 'roof_type_id', 'building_type_id', 'storey_level_id', 'crm_category_id'] as $key) {
                if (! $this->has($key)) {
                    continue;
                }

                $value = $this->input($key);
                $this->merge([
                    $key => $value === '' || $value === null ? null : $value,
                ]);
            }

            $categoryIds = $this->input('crm_category_ids', []);
            if (! is_array($categoryIds)) {
                $single = $this->input('crm_category_id');
                $categoryIds = $single === '' || $single === null ? [] : [$single];
            }
            $categoryIds = array_values(array_map(
                'intval',
                array_filter(
                    $categoryIds,
                    fn ($id) => $id !== '' && $id !== null,
                ),
            ));
            $this->merge([
                'crm_category_ids' => $categoryIds,
                'crm_category_id' => $categoryIds[0] ?? null,
            ]);
        }

        if ($section === 'drawing_checklist' && is_array($this->input('items'))) {
            $items = collect($this->input('items'))
                ->map(fn ($item) => [
                    'key' => $item['key'] ?? null,
                    'checked' => filter_var($item['checked'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'custom_type' => trim((string) ($item['custom_type'] ?? '')),
                ])
                ->all();

            $this->merge(['items' => $items]);
        }

        if ($section === 'building') {
            foreach (['external_wall_construction_id', 'roof_type_id'] as $key) {
                if (! $this->has($key)) {
                    continue;
                }

                $value = $this->input($key);
                $this->merge([
                    $key => $value === '' || $value === null ? null : $value,
                ]);
            }
        }
    }
}
