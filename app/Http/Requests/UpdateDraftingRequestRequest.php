<?php

namespace App\Http\Requests;

use App\Models\DraftingRequest;
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

        if (! $user->hasPermission('job.drafting.view')) {
            return false;
        }

        if (! $user->isAdmin() && $draftingRequest->user_id !== $user->id) {
            return false;
        }

        if ($this->input('section') === 'building_area') {
            return $user->hasPermission('job.drafting.building-area.edit');
        }

        return $user->hasPermission('job.drafting.job-details.edit');
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
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255'],
            ],
            'job' => [
                'section' => ['required', 'string', 'in:job'],
                'status' => ['required', 'string', Rule::in(DraftingRequest::statusValues())],
                'building_type_id' => [
                    'required',
                    'integer',
                    Rule::exists('building_types', 'id')->where(
                        fn ($q) => $q->whereNull('archived_at'),
                    ),
                ],
                'zoning' => ['nullable', 'string', 'max:255'],
                'site_address' => ['required', 'string', 'max:2000'],
                'site_owner_name' => ['nullable', 'string', 'max:255'],
                'service_engaging_ids' => ['required', 'array', 'min:1'],
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

    protected function prepareForValidation(): void
    {
        $section = $this->input('section');

        if ($section === 'job') {
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

        if ($section === 'drawing_checklist' && is_array($this->input('items'))) {
            $items = collect($this->input('items'))
                ->map(fn ($item) => [
                    'key' => $item['key'] ?? null,
                    'checked' => filter_var($item['checked'] ?? false, FILTER_VALIDATE_BOOLEAN),
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
