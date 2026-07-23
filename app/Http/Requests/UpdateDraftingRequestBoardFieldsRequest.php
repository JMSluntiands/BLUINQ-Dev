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
        if ($this->input('date_out') === '') {
            $this->merge(['date_out' => null]);
        }

        if ($this->input('start_date') === '') {
            $this->merge(['start_date' => null]);
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
        ];
    }
}
