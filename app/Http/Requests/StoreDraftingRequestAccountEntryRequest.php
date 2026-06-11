<?php

namespace App\Http\Requests;

use App\Models\DraftingRequestAccountEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDraftingRequestAccountEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasPermission('job.drafting.accounts.add');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'kind' => [
                'required',
                'string',
                Rule::in([
                    DraftingRequestAccountEntry::KIND_QUOTE,
                    DraftingRequestAccountEntry::KIND_INVOICE,
                ]),
            ],
            'number' => ['required', 'string', 'max:64'],
            'category' => ['required', 'string', 'max:64'],
            'rate' => ['nullable', 'string', 'max:64'],
            'status' => ['required', 'string', 'max:64'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'number.required' => 'Enter a number.',
            'category.required' => 'Enter a category.',
            'status.required' => 'Enter a status.',
        ];
    }
}
