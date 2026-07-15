<?php

namespace App\Http\Requests;

use App\Models\LeaveRequest;
use App\Services\LeaveEntitlementService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('leave.apply') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $types = LeaveRequest::types();
        // Keep legacy "leave" accepted and normalized to al
        $types[] = LeaveRequest::TYPE_LEAVE;

        return [
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'type' => ['required', Rule::in(array_values(array_unique($types)))],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'start_date.required' => 'Please select a start date.',
            'start_date.after_or_equal' => 'Start date cannot be in the past.',
            'end_date.required' => 'Please select an end date.',
            'end_date.after_or_equal' => 'End date must be on or after the start date.',
            'type.required' => 'Please select a leave type.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $user = $this->user();
            if (! $user) {
                return;
            }

            $type = LeaveRequest::normalizeType((string) $this->input('type'));
            $config = config("leave.types.{$type}");
            if (! is_array($config)) {
                return;
            }

            $entitlements = app(LeaveEntitlementService::class);

            if (($config['requires_entitlement'] ?? false) && ! $entitlements->isEntitled($user)) {
                $validator->errors()->add(
                    'type',
                    'Staff on probationary or training status are not entitled to this leave type.',
                );
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('type') === LeaveRequest::TYPE_LEAVE) {
            $this->merge(['type' => LeaveRequest::TYPE_AL]);
        }
    }
}
