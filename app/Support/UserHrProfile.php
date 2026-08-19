<?php

namespace App\Support;

use App\Models\UserProfile;
use Illuminate\Validation\Rule;

class UserHrProfile
{
    /**
     * @return list<string>
     */
    public static function fieldKeys(): array
    {
        return [
            'gender',
            'nationality',
            'religion',
            'marital_status',
            'residential_unit_street',
            'residential_barangay',
            'residential_city',
            'residential_state',
            'residential_region',
            'residential_country',
            'residential_postcode',
            'mobile_number',
            'personal_email',
            'hometown_unit_street',
            'hometown_barangay',
            'hometown_city',
            'hometown_state',
            'hometown_region',
            'hometown_country',
            'hometown_postcode',
            'sss_number',
            'pagibig_number',
            'philhealth_number',
            'hmo_number',
            'tin_number',
            'tax_code',
            'bank_name',
            'bank_account_number',
            'ewallet_account_number',
            'department',
            'branch',
            'emergency_contact_name',
            'emergency_relationship',
            'emergency_contact_number',
            'spouse_name',
            'spouse_nationality',
            'spouse_contact_number',
            'spouse_email',
            'number_of_children',
            'spouse_working',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        return [
            'gender' => ['nullable', 'string', Rule::in(array_keys(self::genders()))],
            'nationality' => ['nullable', 'string', 'max:64'],
            'religion' => ['nullable', 'string', 'max:64'],
            'marital_status' => ['nullable', 'string', Rule::in(array_keys(self::maritalStatuses()))],
            'residential_unit_street' => ['nullable', 'string', 'max:255'],
            'residential_barangay' => ['nullable', 'string', 'max:128'],
            'residential_city' => ['nullable', 'string', 'max:128'],
            'residential_state' => ['nullable', 'string', 'max:128'],
            'residential_region' => ['nullable', 'string', 'max:128'],
            'residential_country' => ['nullable', 'string', 'max:128'],
            'residential_postcode' => ['nullable', 'string', 'max:32'],
            'mobile_number' => ['nullable', 'string', 'max:64'],
            'personal_email' => ['nullable', 'email', 'max:255'],
            'hometown_unit_street' => ['nullable', 'string', 'max:255'],
            'hometown_barangay' => ['nullable', 'string', 'max:128'],
            'hometown_city' => ['nullable', 'string', 'max:128'],
            'hometown_state' => ['nullable', 'string', 'max:128'],
            'hometown_region' => ['nullable', 'string', 'max:128'],
            'hometown_country' => ['nullable', 'string', 'max:128'],
            'hometown_postcode' => ['nullable', 'string', 'max:32'],
            'sss_number' => ['nullable', 'string', 'max:64'],
            'pagibig_number' => ['nullable', 'string', 'max:64'],
            'philhealth_number' => ['nullable', 'string', 'max:64'],
            'hmo_number' => ['nullable', 'string', 'max:64'],
            'tin_number' => ['nullable', 'string', 'max:64'],
            'tax_code' => ['nullable', 'string', Rule::in(array_keys(self::taxCodes()))],
            'bank_name' => ['nullable', 'string', 'max:128'],
            'bank_account_number' => ['nullable', 'string', 'max:64'],
            'ewallet_account_number' => ['nullable', 'string', 'max:64'],
            'department' => ['nullable', 'string', 'max:128'],
            'branch' => ['nullable', 'string', 'max:128'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_relationship' => ['nullable', 'string', 'max:64'],
            'emergency_contact_number' => ['nullable', 'string', 'max:64'],
            'spouse_name' => ['nullable', 'string', 'max:255'],
            'spouse_nationality' => ['nullable', 'string', 'max:64'],
            'spouse_contact_number' => ['nullable', 'string', 'max:64'],
            'spouse_email' => ['nullable', 'email', 'max:255'],
            'number_of_children' => ['nullable', 'integer', 'min:0', 'max:30'],
            'spouse_working' => ['nullable', 'string', Rule::in(array_keys(self::yesNo()))],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function options(): array
    {
        return [
            'genders' => self::genders(),
            'maritalStatuses' => self::maritalStatuses(),
            'taxCodes' => self::taxCodes(),
            'yesNo' => self::yesNo(),
            'defaultCountry' => self::defaultCountry(),
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public static function extract(array $validated): array
    {
        $out = [];

        foreach (self::fieldKeys() as $key) {
            $value = $validated[$key] ?? null;

            if ($key === 'number_of_children') {
                $out[$key] = $value === null || $value === '' ? null : (int) $value;

                continue;
            }

            if (is_string($value)) {
                $value = trim($value);
                $out[$key] = $value === '' ? null : $value;

                continue;
            }

            $out[$key] = $value;
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    public static function formDefaults(?UserProfile $profile): array
    {
        $defaults = [];

        foreach (self::fieldKeys() as $key) {
            $value = $profile?->{$key};

            if ($key === 'number_of_children') {
                $defaults[$key] = $value === null ? '' : (string) $value;

                continue;
            }

            $defaults[$key] = $value ?? '';
        }

        if ($defaults['residential_country'] === '') {
            $defaults['residential_country'] = self::defaultCountry();
        }

        if ($defaults['hometown_country'] === '') {
            $defaults['hometown_country'] = self::defaultCountry();
        }

        return $defaults;
    }

    /**
     * @return array<string, mixed>
     */
    public static function payload(?UserProfile $profile): array
    {
        $data = [];

        foreach (self::fieldKeys() as $key) {
            $data[$key] = $profile?->{$key};
        }

        $data['gender_label'] = self::label(self::genders(), $profile?->gender);
        $data['marital_status_label'] = self::label(self::maritalStatuses(), $profile?->marital_status);
        $data['tax_code_label'] = self::label(self::taxCodes(), $profile?->tax_code);
        $data['spouse_working_label'] = self::label(self::yesNo(), $profile?->spouse_working);
        $data['residential_address'] = self::formatAddress($profile, 'residential');
        $data['hometown_address'] = self::formatAddress($profile, 'hometown');

        return $data;
    }

    /**
     * @return array<string, string>
     */
    public static function genders(): array
    {
        return config('user_profile.genders', []);
    }

    /**
     * @return array<string, string>
     */
    public static function maritalStatuses(): array
    {
        return config('user_profile.marital_statuses', []);
    }

    /**
     * @return array<string, string>
     */
    public static function taxCodes(): array
    {
        return config('user_profile.tax_codes', []);
    }

    /**
     * @return array<string, string>
     */
    public static function yesNo(): array
    {
        return config('user_profile.yes_no', []);
    }

    public static function defaultCountry(): string
    {
        return (string) config('user_profile.default_country', 'Philippines');
    }

    /**
     * @param  array<string, string>  $options
     */
    private static function label(array $options, ?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $options[$value] ?? $value;
    }

    private static function formatAddress(?UserProfile $profile, string $prefix): ?string
    {
        if ($profile === null) {
            return null;
        }

        $parts = array_filter([
            $profile->{$prefix.'_unit_street'},
            $profile->{$prefix.'_barangay'},
            $profile->{$prefix.'_city'},
            $profile->{$prefix.'_state'},
            $profile->{$prefix.'_region'},
            $profile->{$prefix.'_country'},
            $profile->{$prefix.'_postcode'},
        ], fn ($part) => filled($part));

        if ($parts === []) {
            return null;
        }

        return implode(', ', $parts);
    }
}
