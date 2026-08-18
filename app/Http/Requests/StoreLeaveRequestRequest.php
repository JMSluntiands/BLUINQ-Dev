<?php

namespace App\Http\Requests;

use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\LeaveEntitlementService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->hasPermission('leave.apply')
            || $user?->hasPermission('leave.manage')
            || false;
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
            'user_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(
                    fn ($q) => $q->whereNull('archived_at'),
                ),
            ],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'start_portion' => ['required', Rule::in(LeaveRequest::portions())],
            'end_portion' => ['required', Rule::in(LeaveRequest::portions())],
            'type' => ['required', Rule::in(array_values(array_unique($types)))],
            'reason' => ['required', 'string', 'max:1000'],
            'medical_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
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
            'start_portion.required' => 'Please choose the starting portion of the day.',
            'end_portion.required' => 'Please choose the ending portion of the day.',
            'type.required' => 'Please select a leave type.',
            'reason.required' => 'Please provide a reason for your leave request.',
            'medical_certificate.mimes' => 'The medical certificate must be a PDF, JPG, or PNG file.',
            'medical_certificate.max' => 'The medical certificate may not be larger than 10 MB.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $actor = $this->user();
            if (! $actor) {
                return;
            }

            $targetUserId = (int) ($this->input('user_id') ?: $actor->id);
            $user = $targetUserId === $actor->id
                ? $actor
                : User::query()->find($targetUserId);

            if (! $user) {
                $validator->errors()->add('user_id', 'Please select a valid user.');

                return;
            }

            if (
                $targetUserId !== $actor->id
                && ! ($actor->hasPermission('leave.manage') ?? false)
            ) {
                $validator->errors()->add(
                    'user_id',
                    'You are not allowed to submit leave requests for other users.',
                );

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

            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $startDate = (string) $this->input('start_date');
            $endDate = (string) $this->input('end_date');
            $startPortion = (string) $this->input('start_portion');
            $endPortion = (string) $this->input('end_portion');

            if (! LeaveRequest::isPortionRangeValid(
                $startDate,
                $endDate,
                $startPortion,
                $endPortion,
            )) {
                $validator->errors()->add(
                    'end_portion',
                    'The ending portion must be on or after the starting portion for the same day.',
                );

                return;
            }

            if (
                LeaveRequest::requiresMedicalCertificateFor($type, $startDate, $endDate)
                && ! $this->hasFile('medical_certificate')
            ) {
                $threshold = LeaveRequest::medicalCertificateThreshold();
                $validator->errors()->add(
                    'medical_certificate',
                    "A medical certificate is required for more than {$threshold} consecutive sick leave days.",
                );
            }
        });
    }

    protected function prepareForValidation(): void
    {
        $updates = [];

        if ($this->input('type') === LeaveRequest::TYPE_LEAVE) {
            $updates['type'] = LeaveRequest::TYPE_AL;
        }

        if (! $this->filled('start_portion')) {
            $updates['start_portion'] = LeaveRequest::PORTION_MORNING;
        }

        if (! $this->filled('end_portion')) {
            $updates['end_portion'] = LeaveRequest::PORTION_AFTERNOON;
        }

        if ($updates !== []) {
            $this->merge($updates);
        }

        if ($this->input('user_id') === '' || $this->input('user_id') === null) {
            $this->merge(['user_id' => null]);
        }
    }
}
