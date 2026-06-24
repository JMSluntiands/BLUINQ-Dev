<?php

namespace App\Http\Requests;

use App\Models\DraftingRequestAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDraftingRequestAssignmentRequest extends FormRequest
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
        $draftingSlots = max(1, (int) config('drafting.drafting_slots', 2));
        $checkingSlots = max(1, (int) config('drafting.checking_slots', 2));
        $maxSlot = max($draftingSlots, $checkingSlots) - 1;

        return [
            'role' => [
                'required',
                'string',
                Rule::in([
                    DraftingRequestAssignment::ROLE_DRAFTING,
                    DraftingRequestAssignment::ROLE_CHECKING,
                ]),
            ],
            'slot' => ['required', 'integer', 'min:0', 'max:'.$maxSlot],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'hours' => ['nullable', 'numeric', 'min:0', 'max:9999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.exists' => 'Select a valid user.',
        ];
    }
}
