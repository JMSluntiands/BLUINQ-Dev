import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

const selectClass =
    'mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500';

function SectionHeading({ title, className = 'sm:col-span-2' }) {
    return (
        <div
            className={
                'border-t border-slate-200 pt-6 first:border-t-0 first:pt-0 ' +
                className
            }
        >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                {title}
            </h3>
        </div>
    );
}

function Field({ label, htmlFor, error, children, className = '' }) {
    return (
        <div className={className}>
            <InputLabel htmlFor={htmlFor} value={label} />
            {children}
            <InputError className="mt-2" message={error} />
        </div>
    );
}

function AddressFields({ prefix, label, form, defaultCountry = 'Philippines' }) {
    const unitKey = `${prefix}_unit_street`;
    const barangayKey = `${prefix}_barangay`;
    const cityKey = `${prefix}_city`;
    const stateKey = `${prefix}_state`;
    const regionKey = `${prefix}_region`;
    const countryKey = `${prefix}_country`;
    const postcodeKey = `${prefix}_postcode`;

    return (
        <div className="space-y-4">
            <SectionHeading title={label} />
            <Field
                label="Unit #, Street Name"
                htmlFor={unitKey}
                error={form.errors[unitKey]}
                className="sm:col-span-2"
            >
                <TextInput
                    id={unitKey}
                    className="mt-1 block w-full"
                    value={form.data[unitKey] ?? ''}
                    onChange={(e) => form.setData(unitKey, e.target.value)}
                />
            </Field>
            <Field
                label="Barangay"
                htmlFor={barangayKey}
                error={form.errors[barangayKey]}
            >
                <TextInput
                    id={barangayKey}
                    className="mt-1 block w-full"
                    value={form.data[barangayKey] ?? ''}
                    onChange={(e) => form.setData(barangayKey, e.target.value)}
                />
            </Field>
            <Field label="City" htmlFor={cityKey} error={form.errors[cityKey]}>
                <TextInput
                    id={cityKey}
                    className="mt-1 block w-full"
                    value={form.data[cityKey] ?? ''}
                    onChange={(e) => form.setData(cityKey, e.target.value)}
                />
            </Field>
            <Field
                label="State / Province"
                htmlFor={stateKey}
                error={form.errors[stateKey]}
            >
                <TextInput
                    id={stateKey}
                    className="mt-1 block w-full"
                    value={form.data[stateKey] ?? ''}
                    onChange={(e) => form.setData(stateKey, e.target.value)}
                />
            </Field>
            <Field
                label="Region"
                htmlFor={regionKey}
                error={form.errors[regionKey]}
            >
                <TextInput
                    id={regionKey}
                    className="mt-1 block w-full"
                    value={form.data[regionKey] ?? ''}
                    onChange={(e) => form.setData(regionKey, e.target.value)}
                />
            </Field>
            <Field
                label="Country"
                htmlFor={countryKey}
                error={form.errors[countryKey]}
            >
                <TextInput
                    id={countryKey}
                    className="mt-1 block w-full"
                    value={form.data[countryKey] || defaultCountry}
                    onChange={(e) => form.setData(countryKey, e.target.value)}
                />
            </Field>
            <Field
                label="Post / ZIP Code"
                htmlFor={postcodeKey}
                error={form.errors[postcodeKey]}
            >
                <TextInput
                    id={postcodeKey}
                    className="mt-1 block w-full"
                    value={form.data[postcodeKey] ?? ''}
                    onChange={(e) => form.setData(postcodeKey, e.target.value)}
                />
            </Field>
        </div>
    );
}

export function userHrProfileFormDefaults(
    user = {},
    hrProfileOptions = {},
) {
    const defaultCountry =
        hrProfileOptions.defaultCountry ?? 'Philippines';

    return {
        gender: user.gender ?? '',
        nationality: user.nationality ?? '',
        religion: user.religion ?? '',
        marital_status: user.marital_status ?? '',
        residential_unit_street: user.residential_unit_street ?? '',
        residential_barangay: user.residential_barangay ?? '',
        residential_city: user.residential_city ?? '',
        residential_state: user.residential_state ?? '',
        residential_region: user.residential_region ?? '',
        residential_country: user.residential_country || defaultCountry,
        residential_postcode: user.residential_postcode ?? '',
        mobile_number: user.mobile_number ?? '',
        personal_email: user.personal_email ?? '',
        hometown_unit_street: user.hometown_unit_street ?? '',
        hometown_barangay: user.hometown_barangay ?? '',
        hometown_city: user.hometown_city ?? '',
        hometown_state: user.hometown_state ?? '',
        hometown_region: user.hometown_region ?? '',
        hometown_country: user.hometown_country || defaultCountry,
        hometown_postcode: user.hometown_postcode ?? '',
        sss_number: user.sss_number ?? '',
        pagibig_number: user.pagibig_number ?? '',
        philhealth_number: user.philhealth_number ?? '',
        hmo_number: user.hmo_number ?? '',
        tin_number: user.tin_number ?? '',
        tax_code: user.tax_code ?? '',
        bank_name: user.bank_name ?? '',
        bank_account_number: user.bank_account_number ?? '',
        ewallet_account_number: user.ewallet_account_number ?? '',
        department: user.department ?? '',
        branch: user.branch ?? '',
        emergency_contact_name: user.emergency_contact_name ?? '',
        emergency_relationship: user.emergency_relationship ?? '',
        emergency_contact_number: user.emergency_contact_number ?? '',
        spouse_name: user.spouse_name ?? '',
        spouse_nationality: user.spouse_nationality ?? '',
        spouse_contact_number: user.spouse_contact_number ?? '',
        spouse_email: user.spouse_email ?? '',
        number_of_children:
            user.number_of_children === null ||
            user.number_of_children === undefined
                ? ''
                : String(user.number_of_children),
        spouse_working: user.spouse_working ?? '',
    };
}

export default function UserHrProfileFields({ form, hrProfileOptions = {} }) {
    const genders = hrProfileOptions.genders ?? {};
    const maritalStatuses = hrProfileOptions.maritalStatuses ?? {};
    const taxCodes = hrProfileOptions.taxCodes ?? {};
    const yesNo = hrProfileOptions.yesNo ?? {};
    const defaultCountry = hrProfileOptions.defaultCountry ?? 'Philippines';

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SectionHeading title="Personal information" />
            <Field label="Gender" htmlFor="gender" error={form.errors.gender}>
                <select
                    id="gender"
                    className={selectClass}
                    value={form.data.gender ?? ''}
                    onChange={(e) => form.setData('gender', e.target.value)}
                >
                    <option value="">Select…</option>
                    {Object.entries(genders).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </Field>
            <Field
                label="Nationality"
                htmlFor="nationality"
                error={form.errors.nationality}
            >
                <TextInput
                    id="nationality"
                    className="mt-1 block w-full"
                    value={form.data.nationality ?? ''}
                    onChange={(e) => form.setData('nationality', e.target.value)}
                />
            </Field>
            <Field
                label="Religion"
                htmlFor="religion"
                error={form.errors.religion}
            >
                <TextInput
                    id="religion"
                    className="mt-1 block w-full"
                    value={form.data.religion ?? ''}
                    onChange={(e) => form.setData('religion', e.target.value)}
                />
            </Field>
            <Field
                label="Marital status"
                htmlFor="marital_status"
                error={form.errors.marital_status}
            >
                <select
                    id="marital_status"
                    className={selectClass}
                    value={form.data.marital_status ?? ''}
                    onChange={(e) =>
                        form.setData('marital_status', e.target.value)
                    }
                >
                    <option value="">Select…</option>
                    {Object.entries(maritalStatuses).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </Field>

            <AddressFields
                prefix="residential"
                label="Residential address"
                form={form}
                defaultCountry={defaultCountry}
            />

            <SectionHeading title="Contact information" />
            <Field
                label="Mobile number"
                htmlFor="mobile_number"
                error={form.errors.mobile_number}
            >
                <TextInput
                    id="mobile_number"
                    className="mt-1 block w-full"
                    value={form.data.mobile_number ?? ''}
                    onChange={(e) =>
                        form.setData('mobile_number', e.target.value)
                    }
                />
            </Field>
            <Field
                label="Personal email"
                htmlFor="personal_email"
                error={form.errors.personal_email}
            >
                <TextInput
                    id="personal_email"
                    type="email"
                    className="mt-1 block w-full"
                    value={form.data.personal_email ?? ''}
                    onChange={(e) =>
                        form.setData('personal_email', e.target.value)
                    }
                />
            </Field>

            <AddressFields
                prefix="hometown"
                label="Hometown address"
                form={form}
                defaultCountry={defaultCountry}
            />

            <SectionHeading title="Government IDs & tax" />
            <Field
                label="SSS number"
                htmlFor="sss_number"
                error={form.errors.sss_number}
            >
                <TextInput
                    id="sss_number"
                    className="mt-1 block w-full"
                    value={form.data.sss_number ?? ''}
                    onChange={(e) => form.setData('sss_number', e.target.value)}
                />
            </Field>
            <Field
                label="Pag-IBIG number"
                htmlFor="pagibig_number"
                error={form.errors.pagibig_number}
            >
                <TextInput
                    id="pagibig_number"
                    className="mt-1 block w-full"
                    value={form.data.pagibig_number ?? ''}
                    onChange={(e) =>
                        form.setData('pagibig_number', e.target.value)
                    }
                />
            </Field>
            <Field
                label="PhilHealth number"
                htmlFor="philhealth_number"
                error={form.errors.philhealth_number}
            >
                <TextInput
                    id="philhealth_number"
                    className="mt-1 block w-full"
                    value={form.data.philhealth_number ?? ''}
                    onChange={(e) =>
                        form.setData('philhealth_number', e.target.value)
                    }
                />
            </Field>
            <Field
                label="HMO number"
                htmlFor="hmo_number"
                error={form.errors.hmo_number}
            >
                <TextInput
                    id="hmo_number"
                    className="mt-1 block w-full"
                    value={form.data.hmo_number ?? ''}
                    onChange={(e) => form.setData('hmo_number', e.target.value)}
                />
            </Field>
            <Field
                label="TIN number"
                htmlFor="tin_number"
                error={form.errors.tin_number}
            >
                <TextInput
                    id="tin_number"
                    className="mt-1 block w-full"
                    value={form.data.tin_number ?? ''}
                    onChange={(e) => form.setData('tin_number', e.target.value)}
                />
            </Field>
            <Field
                label="Tax code"
                htmlFor="tax_code"
                error={form.errors.tax_code}
                className="sm:col-span-2"
            >
                <select
                    id="tax_code"
                    className={selectClass}
                    value={form.data.tax_code ?? ''}
                    onChange={(e) => form.setData('tax_code', e.target.value)}
                >
                    <option value="">Select…</option>
                    {Object.entries(taxCodes).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </Field>

            <SectionHeading title="Banking & e-wallet" />
            <Field
                label="Bank name"
                htmlFor="bank_name"
                error={form.errors.bank_name}
            >
                <TextInput
                    id="bank_name"
                    className="mt-1 block w-full"
                    value={form.data.bank_name ?? ''}
                    onChange={(e) => form.setData('bank_name', e.target.value)}
                />
            </Field>
            <Field
                label="Bank account number"
                htmlFor="bank_account_number"
                error={form.errors.bank_account_number}
            >
                <TextInput
                    id="bank_account_number"
                    className="mt-1 block w-full"
                    value={form.data.bank_account_number ?? ''}
                    onChange={(e) =>
                        form.setData('bank_account_number', e.target.value)
                    }
                />
            </Field>
            <Field
                label="E-wallet account number"
                htmlFor="ewallet_account_number"
                error={form.errors.ewallet_account_number}
                className="sm:col-span-2"
            >
                <TextInput
                    id="ewallet_account_number"
                    className="mt-1 block w-full"
                    value={form.data.ewallet_account_number ?? ''}
                    onChange={(e) =>
                        form.setData('ewallet_account_number', e.target.value)
                    }
                />
            </Field>

            <SectionHeading title="Employment details" />
            <Field
                label="Department"
                htmlFor="department"
                error={form.errors.department}
            >
                <TextInput
                    id="department"
                    className="mt-1 block w-full"
                    value={form.data.department ?? ''}
                    onChange={(e) => form.setData('department', e.target.value)}
                />
            </Field>
            <Field label="Branch" htmlFor="branch" error={form.errors.branch}>
                <TextInput
                    id="branch"
                    className="mt-1 block w-full"
                    value={form.data.branch ?? ''}
                    onChange={(e) => form.setData('branch', e.target.value)}
                />
            </Field>

            <SectionHeading title="Emergency contact" />
            <Field
                label="Person to notify"
                htmlFor="emergency_contact_name"
                error={form.errors.emergency_contact_name}
            >
                <TextInput
                    id="emergency_contact_name"
                    className="mt-1 block w-full"
                    value={form.data.emergency_contact_name ?? ''}
                    onChange={(e) =>
                        form.setData('emergency_contact_name', e.target.value)
                    }
                />
            </Field>
            <Field
                label="Relationship"
                htmlFor="emergency_relationship"
                error={form.errors.emergency_relationship}
            >
                <TextInput
                    id="emergency_relationship"
                    className="mt-1 block w-full"
                    value={form.data.emergency_relationship ?? ''}
                    onChange={(e) =>
                        form.setData('emergency_relationship', e.target.value)
                    }
                />
            </Field>
            <Field
                label="Next of kin contact number"
                htmlFor="emergency_contact_number"
                error={form.errors.emergency_contact_number}
                className="sm:col-span-2"
            >
                <TextInput
                    id="emergency_contact_number"
                    className="mt-1 block w-full"
                    value={form.data.emergency_contact_number ?? ''}
                    onChange={(e) =>
                        form.setData('emergency_contact_number', e.target.value)
                    }
                />
            </Field>

            <SectionHeading title="Spouse details" />
            <Field
                label="Name"
                htmlFor="spouse_name"
                error={form.errors.spouse_name}
            >
                <TextInput
                    id="spouse_name"
                    className="mt-1 block w-full"
                    value={form.data.spouse_name ?? ''}
                    onChange={(e) => form.setData('spouse_name', e.target.value)}
                />
            </Field>
            <Field
                label="Nationality"
                htmlFor="spouse_nationality"
                error={form.errors.spouse_nationality}
            >
                <TextInput
                    id="spouse_nationality"
                    className="mt-1 block w-full"
                    value={form.data.spouse_nationality ?? ''}
                    onChange={(e) =>
                        form.setData('spouse_nationality', e.target.value)
                    }
                />
            </Field>
            <Field
                label="Contact number"
                htmlFor="spouse_contact_number"
                error={form.errors.spouse_contact_number}
            >
                <TextInput
                    id="spouse_contact_number"
                    className="mt-1 block w-full"
                    value={form.data.spouse_contact_number ?? ''}
                    onChange={(e) =>
                        form.setData('spouse_contact_number', e.target.value)
                    }
                />
            </Field>
            <Field
                label="Email"
                htmlFor="spouse_email"
                error={form.errors.spouse_email}
            >
                <TextInput
                    id="spouse_email"
                    type="email"
                    className="mt-1 block w-full"
                    value={form.data.spouse_email ?? ''}
                    onChange={(e) =>
                        form.setData('spouse_email', e.target.value)
                    }
                />
            </Field>
            <Field
                label="No. of children"
                htmlFor="number_of_children"
                error={form.errors.number_of_children}
            >
                <TextInput
                    id="number_of_children"
                    type="number"
                    min="0"
                    max="30"
                    className="mt-1 block w-full"
                    value={form.data.number_of_children ?? ''}
                    onChange={(e) =>
                        form.setData('number_of_children', e.target.value)
                    }
                />
            </Field>
            <Field
                label="Working?"
                htmlFor="spouse_working"
                error={form.errors.spouse_working}
            >
                <select
                    id="spouse_working"
                    className={selectClass}
                    value={form.data.spouse_working ?? ''}
                    onChange={(e) =>
                        form.setData('spouse_working', e.target.value)
                    }
                >
                    <option value="">Select…</option>
                    {Object.entries(yesNo).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </Field>
        </div>
    );
}
