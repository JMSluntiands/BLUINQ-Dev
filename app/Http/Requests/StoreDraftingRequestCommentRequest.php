<?php

namespace App\Http\Requests;

use App\Models\DraftingRequest;
use App\Models\DraftingRequestComment;
use App\Support\AnnouncementHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDraftingRequestCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('drafting_request_revision_id') === '') {
            $this->merge(['drafting_request_revision_id' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var DraftingRequest|null $draftingRequest */
        $draftingRequest = $this->route('draftingRequest');

        return [
            'kind' => [
                'required',
                'string',
                Rule::in([
                    DraftingRequestComment::KIND_COMMENT,
                    DraftingRequestComment::KIND_RUN,
                ]),
            ],
            'drafting_request_revision_id' => [
                'nullable',
                'integer',
                Rule::exists('drafting_request_revisions', 'id')->where(
                    fn ($query) => $draftingRequest
                        ? $query->where('drafting_request_id', $draftingRequest->id)
                        : $query->whereRaw('1 = 0'),
                ),
            ],
            'body' => [
                'required',
                'string',
                'max:200000',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! AnnouncementHtml::descriptionHasContent((string) $value)) {
                        $fail('Please enter a comment.');
                    }
                },
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.required' => 'Please enter a comment.',
            'drafting_request_revision_id.exists' => 'Select a valid revision for this project.',
        ];
    }

    public function sanitizedBody(): string
    {
        return AnnouncementHtml::sanitizeDescription((string) $this->input('body'));
    }

    public function revisionId(): ?int
    {
        $value = $this->validated('drafting_request_revision_id');

        return $value !== null ? (int) $value : null;
    }
}
