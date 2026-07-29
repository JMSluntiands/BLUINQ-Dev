<?php

namespace App\Http\Requests;

use App\Models\DraftingRequest;
use App\Models\DraftingRequestComment;
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
                'max:65535',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $text = trim(strip_tags((string) $value));
                    if ($text === '') {
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
        $allowed = '<p><br><strong><b><em><i><u><ul><ol><li><a><h2><h3><blockquote>';
        $clean = strip_tags((string) $this->input('body'), $allowed);

        return trim($clean);
    }

    public function revisionId(): ?int
    {
        $value = $this->validated('drafting_request_revision_id');

        return $value !== null ? (int) $value : null;
    }
}
