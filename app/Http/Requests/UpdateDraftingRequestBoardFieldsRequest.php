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
        foreach (['date_out', 'start_date', 'date_in', 'eta'] as $key) {
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
        ];
    }
}
