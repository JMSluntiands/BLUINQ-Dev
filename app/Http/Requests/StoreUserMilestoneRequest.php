<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserMilestoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('profile.milestones.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'milestone_date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:255'],
            'impact_result' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
