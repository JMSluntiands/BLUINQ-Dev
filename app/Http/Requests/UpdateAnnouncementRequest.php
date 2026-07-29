<?php

namespace App\Http\Requests;

use App\Support\AnnouncementHtml;
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
            'image' => ['nullable', 'image', 'max:4096'],
            'description' => [
                'required',
                'string',
                'max:200000',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! AnnouncementHtml::descriptionHasContent((string) $value)) {
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
        return AnnouncementHtml::sanitizeDescription($this->input('description'));
    }
}
