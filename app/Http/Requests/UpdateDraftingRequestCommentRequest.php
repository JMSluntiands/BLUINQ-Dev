<?php

namespace App\Http\Requests;

use App\Support\AnnouncementHtml;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDraftingRequestCommentRequest extends FormRequest
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
        return [
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
        ];
    }

    public function sanitizedBody(): string
    {
        return AnnouncementHtml::sanitizeDescription((string) $this->input('body'));
    }
}
