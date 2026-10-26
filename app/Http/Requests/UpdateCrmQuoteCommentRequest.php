<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCrmQuoteCommentRequest extends FormRequest
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
                'max:65535',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (trim(strip_tags((string) $value)) === '') {
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
        $allowed = '<p><br><strong><b><em><i><u><ul><ol><li><a><h2><h3><blockquote>';

        return trim(strip_tags((string) $this->input('body'), $allowed));
    }
}
