<?php

namespace App\Http\Requests;

use App\Models\DraftingRequest;
use App\Models\DraftingRequestAccountEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDraftingRequestAccountEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null || ! $user->hasPermission('job.drafting.accounts.add')) {
            return false;
        }

        /** @var DraftingRequest|null $draftingRequest */
        $draftingRequest = $this->route('draftingRequest');

        /** @var DraftingRequestAccountEntry|null $accountEntry */
        $accountEntry = $this->route('accountEntry');

        if ($draftingRequest === null || $accountEntry === null) {
            return false;
        }

        if ($draftingRequest->isArchived()) {
            return false;
        }

        if ($accountEntry->drafting_request_id !== $draftingRequest->id) {
            return false;
        }

        if (! $user->hasPermission('job.drafting.view')) {
            return false;
        }

        if (! $user->isAdmin() && $draftingRequest->user_id !== $user->id) {
            return false;
        }

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'number' => ['required', 'string', 'max:64'],
            'category' => ['required', 'string', 'max:64'],
            'rate' => ['nullable', 'string', 'max:64'],
            'status' => [
                'required',
                'string',
                Rule::in(DraftingRequestAccountEntry::accountStatusOptions()),
            ],
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
            'status.required' => 'Select a status.',
            'status.in' => 'Select a valid status.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('status') && is_string($this->input('status'))) {
            $this->merge([
                'status' => DraftingRequestAccountEntry::normalizeStatus($this->input('status')),
            ]);
        }
    }
}
