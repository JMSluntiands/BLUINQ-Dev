import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useCallback } from 'react';

function ReqMark() {
    return <span className="text-red-600"> *</span>;
}

/** Label, optional short hint, then controls — no bottom alignment tricks so paired columns stay natural. */
function FieldBlock({ label, hint, children, error, className = '' }) {
    return (
        <div className={`min-w-0 space-y-2 ${className}`}>
            {label}
            <p className="min-h-[1rem] text-xs leading-snug text-slate-500">
                {hint ? hint : <span className="invisible">.</span>}
            </p>
            <div className="space-y-2">
                {children}
                {error ? <InputError message={error} /> : null}
            </div>
        </div>
    );
}

/** Two columns from `lg` — children may use `className="lg:col-span-2"` for full width. */
function FormRow({ children }) {
    return (
        <div className="grid w-full min-w-0 grid-cols-1 gap-x-6 gap-y-8 sm:gap-x-8 lg:grid-cols-2 lg:items-start lg:gap-x-10 lg:gap-y-10">
            {children}
        </div>
    );
}

const inputClass =
    'block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';
const selectClass = inputClass;
const textareaClass = inputClass + ' min-h-[120px]';

export default function DraftingRequestForm({
    applicant,
    serviceEngagings = [],
    buildingTypes = [],
    externalWallConstructions = [],
    roofTypes = [],
}) {
    const { logo_url: logoUrl } = usePage().props;

    const { data, setData, post, processing, errors, transform } = useForm({
        requested_at: applicant.requested_at,
        your_name: applicant.your_name,
        company_name: applicant.company_name,
        email: applicant.email,
        service_engaging_ids: [],
        site_address: '',
        site_owner_name: '',
        max_building_area_sqm: '',
        design_requirements: '',
        building_type_id: '',
        ndis_sda: false,
        external_wall_construction_id: '',
        roof_type_id: '',
        ceiling_heights: '',
        first_floor_slab: '',
        additional_inclusions: '',
        facade: null,
        documents: [],
    });

    transform((form) => {
        const next = { ...form };
        if (!next.facade) {
            delete next.facade;
        }
        return next;
    });

    const toggleServiceEngaging = useCallback(
        (id) => {
            const n = Number(id);
            const ids = data.service_engaging_ids;
            if (ids.includes(n)) {
                setData(
                    'service_engaging_ids',
                    ids.filter((x) => x !== n),
                );
            } else {
                setData('service_engaging_ids', [...ids, n]);
            }
        },
        [data.service_engaging_ids, setData],
    );

    const submit = (e) => {
        e.preventDefault();
        post(route('job.drafting-request-form.store'), {
            forceFormData: true,
        });
    };

    const designLen = data.design_requirements?.length ?? 0;
    const addIncLen = data.additional_inclusions?.length ?? 0;

    return (
        <AuthenticatedLayout>
            <Head title="Drafting Request Form" />

            <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-5 pb-12 sm:space-y-6">
                <div>
                    <Link
                        href={route('job.drafting')}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        ← Back to Archi Team
                    </Link>
                </div>

                <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
                        <div className="flex flex-wrap items-start gap-6">
                            {logoUrl && (
                                <img
                                    src={logoUrl}
                                    alt="Bluinq"
                                    className="h-12 w-auto object-contain sm:h-14"
                                />
                            )}
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                    Drafting Request Form
                                </h1>
                                <p className="mt-2 max-w-[85ch] text-sm leading-relaxed text-slate-600 sm:text-base">
                                    Thank you for using BLUINQ for your
                                    architectural documentation. Please complete
                                    the form below.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={submit}
                        className="w-full min-w-0 space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:space-y-10 lg:px-10"
                        encType="multipart/form-data"
                    >
                        <FormRow>
                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="requested_at">
                                        1. Date
                                        <ReqMark />
                                    </InputLabel>
                                }
                                error={errors.requested_at}
                            >
                                <TextInput
                                    id="requested_at"
                                    type="datetime-local"
                                    className={inputClass}
                                    value={data.requested_at}
                                    onChange={(e) =>
                                        setData(
                                            'requested_at',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="your_name">
                                        2. Your Name
                                        <ReqMark />
                                    </InputLabel>
                                }
                                error={errors.your_name}
                            >
                                <TextInput
                                    id="your_name"
                                    className={inputClass}
                                    value={data.your_name}
                                    onChange={(e) =>
                                        setData('your_name', e.target.value)
                                    }
                                    required
                                    autoComplete="name"
                                />
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="company_name">
                                        3. Company Name
                                        <ReqMark />
                                    </InputLabel>
                                }
                                hint="From your profile when set — editable here."
                                error={errors.company_name}
                            >
                                <TextInput
                                    id="company_name"
                                    className={inputClass}
                                    value={data.company_name}
                                    onChange={(e) =>
                                        setData(
                                            'company_name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    autoComplete="organization"
                                />
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="email">
                                        4. Your Email
                                        <ReqMark />
                                    </InputLabel>
                                }
                                error={errors.email}
                            >
                                <TextInput
                                    id="email"
                                    type="email"
                                    className={inputClass}
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    required
                                    autoComplete="email"
                                />
                            </FieldBlock>
                        </FormRow>

                        <FormRow>
                            <FieldBlock
                                className="lg:col-span-2"
                                label={
                                    <InputLabel value="">
                                        5. Type of Service Engaging
                                        <ReqMark />
                                    </InputLabel>
                                }
                                hint={
                                    'Note: For the job material documents/files – please email or upload them to SharePoint. ' +
                                    'Incomplete files can affect deliverable accuracy.'
                                }
                                error={
                                    errors.service_engaging_ids ??
                                    errors['service_engaging_ids.0']
                                }
                            >
                                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                                    {serviceEngagings.map((row) => (
                                        <li key={row.id} className="min-w-0">
                                            <label className="flex h-full min-h-[3rem] cursor-pointer items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-slate-200 hover:bg-slate-100">
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={data.service_engaging_ids.includes(
                                                        row.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleServiceEngaging(
                                                            row.id,
                                                        )
                                                    }
                                                />
                                                <span className="text-sm font-medium text-slate-800">
                                                    {row.name}
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                                {serviceEngagings.length === 0 ? (
                                    <p className="text-sm text-amber-800">
                                        No service types are configured yet. Ask
                                        an administrator to add entries under
                                        Workflow settings → Service Engaging.
                                    </p>
                                ) : null}
                            </FieldBlock>
                        </FormRow>

                        <FormRow>
                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="site_address">
                                        6. Site Address Details
                                        <ReqMark />
                                    </InputLabel>
                                }
                                hint="Unit No. – Lot No. – Street No. – Street Name – Suburb – State – Postcode"
                                error={errors.site_address}
                            >
                                <TextInput
                                    id="site_address"
                                    className={inputClass}
                                    value={data.site_address}
                                    onChange={(e) =>
                                        setData(
                                            'site_address',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="site_owner_name">
                                        7. Site Owner Name
                                        <ReqMark />
                                    </InputLabel>
                                }
                                error={errors.site_owner_name}
                            >
                                <TextInput
                                    id="site_owner_name"
                                    className={inputClass}
                                    value={data.site_owner_name}
                                    onChange={(e) =>
                                        setData(
                                            'site_owner_name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </FieldBlock>
                        </FormRow>

                        <div className="flex w-full min-w-0 flex-col gap-8 lg:gap-10">
                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="max_building_area_sqm">
                                        8. Maximum Building Area Size
                                    </InputLabel>
                                }
                                hint="Area in square meter."
                                error={errors.max_building_area_sqm}
                            >
                                <TextInput
                                    id="max_building_area_sqm"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={inputClass}
                                    value={data.max_building_area_sqm}
                                    onChange={(e) =>
                                        setData(
                                            'max_building_area_sqm',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="design_requirements">
                                        9. Design Requirements
                                    </InputLabel>
                                }
                                hint="e.g. How many bedrooms, baths, theatre, garage, etc…"
                                error={errors.design_requirements}
                            >
                                <textarea
                                    id="design_requirements"
                                    className={textareaClass}
                                    maxLength={2000}
                                    value={data.design_requirements}
                                    onChange={(e) =>
                                        setData(
                                            'design_requirements',
                                            e.target.value,
                                        )
                                    }
                                />
                                <p className="text-right text-xs text-slate-500">
                                    {designLen}/2000
                                </p>
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="building_type_id">
                                        10. Building Type
                                        <ReqMark />
                                    </InputLabel>
                                }
                                hint="Options come from Workflow settings → Building type."
                                error={errors.building_type_id}
                            >
                                <select
                                    id="building_type_id"
                                    className={selectClass}
                                    value={data.building_type_id}
                                    onChange={(e) =>
                                        setData(
                                            'building_type_id',
                                            e.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">Select…</option>
                                    {buildingTypes.map((row) => (
                                        <option key={row.id} value={row.id}>
                                            {row.name}
                                        </option>
                                    ))}
                                </select>
                                {buildingTypes.length === 0 ? (
                                    <p className="text-sm text-amber-800">
                                        No building types configured. Add them
                                        under Workflow settings → Building type.
                                    </p>
                                ) : null}
                            </FieldBlock>
                        </div>

                        <FieldBlock
                            className="w-full"
                            label={
                                <InputLabel htmlFor="facade">
                                    11. Facade Type
                                </InputLabel>
                            }
                            hint="Please share the photo/image of the facade type."
                            error={errors.facade}
                        >
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-slate-100">
                                <ArrowUpTrayIcon
                                    className="mb-2 h-10 w-10 text-slate-400"
                                    aria-hidden
                                />
                                <span className="text-sm text-slate-700">
                                    <span className="font-semibold text-indigo-600">
                                        Choose a file to upload
                                    </span>{' '}
                                    or drag and drop here.
                                </span>
                                <input
                                    id="facade"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        setData(
                                            'facade',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </label>
                            {data.facade ? (
                                <p className="text-sm text-slate-600">
                                    Selected: {data.facade.name}
                                </p>
                            ) : null}
                        </FieldBlock>

                        <FieldBlock
                            label={
                                <InputLabel htmlFor="ndis_sda">
                                    12. NDIS – SDA Dwelling (Class 3)
                                </InputLabel>
                            }
                            hint="Please mark tick if this is an NDIS requirement dwelling."
                            error={errors.ndis_sda}
                        >
                            <label className="inline-flex min-h-[3rem] w-full max-w-xl items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                                <input
                                    id="ndis_sda"
                                    type="checkbox"
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={data.ndis_sda}
                                    onChange={(e) =>
                                        setData('ndis_sda', e.target.checked)
                                    }
                                />
                                <span className="text-sm font-medium text-slate-800">
                                    NDIS / SDA dwelling
                                </span>
                            </label>
                        </FieldBlock>

                        <FormRow>
                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="external_wall_construction_id">
                                        13. External Wall Construction
                                    </InputLabel>
                                }
                                hint="Options from Workflow settings → External wall construction."
                                error={errors.external_wall_construction_id}
                            >
                                <select
                                    id="external_wall_construction_id"
                                    className={selectClass}
                                    value={data.external_wall_construction_id}
                                    onChange={(e) =>
                                        setData(
                                            'external_wall_construction_id',
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">Select…</option>
                                    {externalWallConstructions.map((row) => (
                                        <option key={row.id} value={row.id}>
                                            {row.name}
                                        </option>
                                    ))}
                                </select>
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="roof_type_id">
                                        14. Roof Type
                                    </InputLabel>
                                }
                                hint="Options from Workflow settings → Roof type."
                                error={errors.roof_type_id}
                            >
                                <select
                                    id="roof_type_id"
                                    className={selectClass}
                                    value={data.roof_type_id}
                                    onChange={(e) =>
                                        setData(
                                            'roof_type_id',
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">Select…</option>
                                    {roofTypes.map((row) => (
                                        <option key={row.id} value={row.id}>
                                            {row.name}
                                        </option>
                                    ))}
                                </select>
                            </FieldBlock>
                        </FormRow>

                        <FormRow>
                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="ceiling_heights">
                                        15. Ceiling Heights
                                        <ReqMark />
                                    </InputLabel>
                                }
                                hint="For any upper-floor dwelling, please advise ceiling height for each level."
                                error={errors.ceiling_heights}
                            >
                                <TextInput
                                    id="ceiling_heights"
                                    className={inputClass}
                                    value={data.ceiling_heights}
                                    onChange={(e) =>
                                        setData(
                                            'ceiling_heights',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="first_floor_slab">
                                        16. First Floor Slab/Construction
                                    </InputLabel>
                                }
                                error={errors.first_floor_slab}
                            >
                                <TextInput
                                    id="first_floor_slab"
                                    className={inputClass}
                                    value={data.first_floor_slab}
                                    onChange={(e) =>
                                        setData(
                                            'first_floor_slab',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FieldBlock>
                        </FormRow>

                        <FieldBlock
                            className="w-full"
                            label={
                                <InputLabel htmlFor="additional_inclusions">
                                    17. Additional Inclusions
                                </InputLabel>
                            }
                            hint="Kindly note all additional instructions to be drawn and to be included. e.g. add-ons Granny Flat/Ancillary area, loft, etc."
                            error={errors.additional_inclusions}
                        >
                            <textarea
                                id="additional_inclusions"
                                className={textareaClass}
                                maxLength={2000}
                                value={data.additional_inclusions}
                                onChange={(e) =>
                                    setData(
                                        'additional_inclusions',
                                        e.target.value,
                                    )
                                }
                            />
                            <p className="text-right text-xs text-slate-500">
                                {addIncLen}/2000
                            </p>
                        </FieldBlock>

                        <FieldBlock
                            className="w-full"
                            label={
                                <InputLabel htmlFor="documents">
                                    18. Upload all documents required.
                                    <ReqMark />
                                </InputLabel>
                            }
                            hint={
                                <span>
                                    The Engaged Party must give the following
                                    material documents/files:
                                    <ul className="mt-2 list-disc space-y-1 ps-5">
                                        <li>
                                            Company/title block template
                                            (PLN/DWG).
                                        </li>
                                        <li>
                                            All necessary information and/or
                                            instructions to be given upon
                                            engagement; any design charges after
                                            commencement of work will be treated as
                                            revision.
                                        </li>
                                        <li>
                                            Sample of previous jobs to assist with
                                            our formatting.
                                        </li>
                                    </ul>
                                </span>
                            }
                            error={
                                errors.documents ?? errors['documents.0']
                            }
                        >
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-slate-100">
                                <ArrowUpTrayIcon
                                    className="mb-2 h-10 w-10 text-slate-400"
                                    aria-hidden
                                />
                                <span className="text-sm text-slate-700">
                                    <span className="font-semibold text-indigo-600">
                                        Choose files to upload
                                    </span>{' '}
                                    or drag and drop here (multiple files
                                    allowed).
                                </span>
                                <input
                                    id="documents"
                                    type="file"
                                    multiple
                                    className="sr-only"
                                    onChange={(e) =>
                                        setData(
                                            'documents',
                                            e.target.files?.length
                                                ? Array.from(e.target.files)
                                                : [],
                                        )
                                    }
                                />
                            </label>
                            {data.documents?.length > 0 ? (
                                <ul className="mt-2 text-sm text-slate-600">
                                    {data.documents.map((f, i) => (
                                        <li key={i}>{f.name}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </FieldBlock>

                        <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-8">
                            <PrimaryButton type="submit" loading={processing}>
                                Submit request
                            </PrimaryButton>
                            <Link
                                href={route('job.drafting')}
                                className="text-sm font-medium text-slate-600 hover:text-slate-900"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
