<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDraftingRequestFilesRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasPermission('job.drafting.files.edit');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'facade' => ['nullable', 'file', 'max:20480'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:20480'],
            'team_files' => ['nullable', 'array'],
            'team_files.*' => ['file', 'max:20480'],
        ];
    }
}
