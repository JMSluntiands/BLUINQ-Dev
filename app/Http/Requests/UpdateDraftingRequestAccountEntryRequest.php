<?php

namespace App\Http\Requests;

use App\Models\CrmCategory;
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

        // Same capability as Add quote/invoice — not limited to Admin or job owner.
        return $accountEntry->drafting_request_id === $draftingRequest->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $allowed = $this->allowedCategoryValues();

        /** @var DraftingRequestAccountEntry|null $accountEntry */
        $accountEntry = $this->route('accountEntry');
        $existing = trim((string) ($accountEntry?->category ?? ''));
        if ($existing !== '' && ! in_array($existing, $allowed, true)) {
            $allowed[] = $existing;
        }

        return [
            'number' => ['required', 'string', 'max:64'],
            'category' => ['required', 'string', 'max:64', Rule::in($allowed)],
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
            'category.required' => 'Select a category.',
            'category.in' => 'Select a valid category.',
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

    /**
     * @return list<string>
     */
    private function allowedCategoryValues(): array
    {
        return CrmCategory::query()
            ->active()
            ->orderBy('code')
            ->get(['code', 'name'])
            ->flatMap(fn (CrmCategory $row) => array_filter([$row->code, $row->name]))
            ->unique()
            ->values()
            ->all();
    }
}
