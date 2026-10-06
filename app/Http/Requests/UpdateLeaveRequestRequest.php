<?php

namespace App\Http\Requests;

use App\Models\LeaveRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('leave.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $types = LeaveRequest::types();
        $types[] = LeaveRequest::TYPE_LEAVE;

        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'start_portion' => ['required', Rule::in(LeaveRequest::portions())],
            'end_portion' => ['required', Rule::in(LeaveRequest::portions())],
            'type' => ['required', Rule::in(array_values(array_unique($types)))],
            'reason' => ['required', 'string', 'max:1000'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
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
            'end_date.required' => 'Please select an end date.',
            'end_date.after_or_equal' => 'End date must be on or after the start date.',
            'type.required' => 'Please select a leave type.',
            'reason.required' => 'Please provide a reason for this leave.',
            'attachment.mimes' => 'The attachment must be a PDF, JPG, or PNG file.',
            'attachment.max' => 'The attachment may not be larger than 10 MB.',
            'medical_certificate.mimes' => 'The attachment must be a PDF, JPG, or PNG file.',
            'medical_certificate.max' => 'The attachment may not be larger than 10 MB.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var LeaveRequest|null $leaveRequest */
            $leaveRequest = $this->route('leaveRequest');
            if (! $leaveRequest instanceof LeaveRequest) {
                return;
            }

            $leaveRequest->loadMissing('user');
            $user = $leaveRequest->user;
            if (! $user) {
                return;
            }

            $type = LeaveRequest::normalizeType((string) $this->input('type'));
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

            $requestedDays = LeaveRequest::calculateRequestedDays(
                $startDate,
                $endDate,
                $startPortion,
                $endPortion,
                $user->holiday_region,
            );

            if ($requestedDays <= 0) {
                $validator->errors()->add(
                    'end_date',
                    'The selected range only contains weekends or public holidays.',
                );

                return;
            }

            $hasExistingAttachment = $leaveRequest->hasAttachment();
            if (
                LeaveRequest::requiresMedicalCertificateFor(
                    $type,
                    $startDate,
                    $endDate,
                    $user->holiday_region,
                )
                && ! $hasExistingAttachment
                && ! $this->hasFile('attachment')
                && ! $this->hasFile('medical_certificate')
            ) {
                $threshold = LeaveRequest::medicalCertificateThreshold();
                $message = "A medical certificate is required for more than {$threshold} consecutive sick leave days.";
                $validator->errors()->add('attachment', $message);
                $validator->errors()->add('medical_certificate', $message);
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
    }
}
