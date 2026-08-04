<?php

namespace App\Http\Requests;

use App\Models\DraftingRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDraftingRequestBoardFieldsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        foreach (['date_out', 'start_date', 'date_in', 'eta', 'vo_hours', 'max_building_area_sqm'] as $key) {
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
        return [
            'status' => ['sometimes', 'required', 'string', Rule::in(DraftingRequest::statusValues())],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'date_out' => ['sometimes', 'nullable', 'date'],
            'date_in' => ['sometimes', 'nullable', 'date'],
            'eta' => ['sometimes', 'nullable', 'date'],
            'vo_hours' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:9999.99'],
            'max_building_area_sqm' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }
}
