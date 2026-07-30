<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'initials' => ['nullable', 'string', 'max:10', 'regex:/^[A-Za-z0-9.\- ]*$/'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'employee_number' => ['nullable', 'string', 'max:50'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'date_hired' => ['nullable', 'date'],
            'birthday' => ['nullable', 'date'],
            'personal_details' => ['nullable', 'string', 'max:5000'],
            'personal_file_url' => ['nullable', 'url', 'max:2048'],
            'claims_excel_url' => ['nullable', 'url', 'max:2048'],
            'profile_image' => ['nullable', 'image', 'max:2048'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $initials = $this->input('initials');

        if ($initials === null) {
            return;
        }

        $trimmed = trim((string) $initials);

        $this->merge([
            'initials' => $trimmed === '' ? null : mb_strtoupper($trimmed),
        ]);
    }
}
