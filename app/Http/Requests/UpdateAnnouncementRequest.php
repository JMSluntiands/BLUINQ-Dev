<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('announcements.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => [
                'required',
                'string',
                'max:65535',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $text = trim(strip_tags((string) $value));
                    if ($text === '') {
                        $fail('Please enter a description.');
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
            'title.required' => 'Please enter a title.',
            'description.required' => 'Please enter a description.',
        ];
    }

    public function sanitizedDescription(): string
    {
        $allowed = '<p><br><strong><b><em><i><u><ul><ol><li><a><h2><h3><blockquote>';
        $clean = strip_tags((string) $this->input('description'), $allowed);

        return trim($clean);
    }
}
