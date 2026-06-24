<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDraftingMemoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('drafting-memos.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'client_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'reference_url' => ['nullable', 'url', 'max:2048'],
            'memo_date' => ['required', 'date'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => [
                'integer',
                Rule::exists('drafting_memo_tags', 'id'),
            ],
            'attachment' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }
}
