<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDraftingRequestCommentRequest extends FormRequest
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
        ];
    }

    public function sanitizedBody(): string
    {
        $allowed = '<p><br><strong><b><em><i><u><ul><ol><li><a><h2><h3><blockquote>';
        $clean = strip_tags((string) $this->input('body'), $allowed);

        return trim($clean);
    }
}
