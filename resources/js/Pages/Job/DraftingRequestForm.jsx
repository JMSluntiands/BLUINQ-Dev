import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select2 from '@/Components/Select2';
import TextInput from '@/Components/TextInput';
import AppLogo from '@/Components/AppLogo';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PublicFormLayout from '@/Layouts/PublicFormLayout';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';

function ReqMark() {
    return <span className="text-red-600"> *</span>;
}

/** Label, optional short hint, then controls — no bottom alignment tricks so paired columns stay natural. */
function FieldBlock({ label, hint, children, error, className = '' }) {
    return (
        <div className={`min-w-0 space-y-2 ${className}`}>
            {label}
            <p className="min-h-[1rem] text-xs leading-snug text-slate-500 dark:text-slate-400">
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
    'block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400';

const uploadZoneClass =
    'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-indigo-500 dark:hover:bg-slate-700';

const mutedTextClass = 'text-sm text-slate-600 dark:text-slate-300';

const selectClass = inputClass;

const displayValueClass =
    'text-sm font-medium text-slate-900 dark:text-slate-100';

function DisplayValue({ value, emptyLabel = '—' }) {
    const hasValue = Boolean(value && String(value).trim());

    return (
        <p className={displayValueClass}>
            {hasValue ? (
                value
            ) : (
                <span className="font-normal text-slate-400 dark:text-slate-500">
                    {emptyLabel}
                </span>
            )}
        </p>
    );
}

export default function DraftingRequestForm({
    applicant,
    clients = [],
    categories = [],
    sdaTypes = [],
    storeyLevels = [],
    buildingClasses = [],
    externalWallConstructions = [],
    standalone = false,
    submitted = false,
    submitUrl = null,
    backUrl = null,
    formTitle = null,
    mode = 'create',
}) {
    const { logo_url: logoUrl, auth } = usePage().props;
    const Layout = standalone ? PublicFormLayout : AuthenticatedLayout;
    const isEdit = mode === 'edit';
    const pageTitle =
        formTitle ?? (isEdit ? 'Edit masterlist entry' : 'Drafting Request Form');
    const listBackUrl = backUrl ?? (standalone ? null : route('job.masterlist'));
    const storeRoute =
        submitUrl ??
        (standalone
            ? route('public.drafting-request-form.store')
            : route('job.masterlist.store'));
    const loggedInName = auth?.user?.name ?? '';

    const { data, setData, post, processing, errors, transform } = useForm({
        requested_at: applicant.requested_at,
        your_name: standalone
            ? (applicant.your_name ?? '')
            : (applicant.your_name || loggedInName || ''),
        client_id: applicant.client_id ? String(applicant.client_id) : '',
        company_name: applicant.company_name ?? '',
        email: applicant.email ?? '',
        phone: applicant.phone ?? '',
        crm_category_id: applicant.crm_category_id ?? '',
        site_address: applicant.site_address ?? '',
        council_shire: applicant.council_shire ?? '',
        site_owner_name: applicant.site_owner_name ?? '',
        max_building_area_sqm: applicant.max_building_area_sqm ?? '',
        building_class_id: applicant.building_class_id ?? '',
        storey_level_id: applicant.storey_level_id ?? '',
        zoning: applicant.zoning ?? '',
        sda_type_ids: (applicant.sda_type_ids ?? []).map(String),
        ndis_sda: Boolean(applicant.ndis_sda),
        external_wall_construction_id:
            applicant.external_wall_construction_id ?? '',
        documents: [],
    });

    transform((form) => {
        const next = { ...form };
        if (!next.documents?.length) {
            delete next.documents;
        }
        next.sda_type_ids = (next.sda_type_ids ?? []).map((id) => Number(id));
        next.ndis_sda = next.sda_type_ids.length > 0;
        if (next.client_id === '' || next.client_id == null) {
            next.client_id = null;
        }
        if (!standalone && loggedInName) {
            next.your_name = loggedInName;
        }
        return next;
    });

    const clientOptions = useMemo(
        () =>
            clients.map((client) => ({
                value: String(client.id),
                label: client.name,
            })),
        [clients],
    );

    const sdaTypeOptions = useMemo(
        () =>
            sdaTypes.map((row) => ({
                value: String(row.id),
                label: row.code ? `${row.code} — ${row.name}` : row.name,
            })),
        [sdaTypes],
    );

    const selectedClient = useMemo(
        () =>
            clients.find((c) => String(c.id) === String(data.client_id)) ??
            null,
        [clients, data.client_id],
    );

    const handleClientChange = useCallback(
        (value) => {
            const client = clients.find(
                (row) => String(row.id) === String(value),
            );
            if (!client) {
                setData({
                    client_id: '',
                    company_name: '',
                    email: '',
                    phone: '',
                    ...(standalone ? { your_name: '' } : {}),
                });
                return;
            }
            setData({
                client_id: String(client.id),
                company_name: client.name ?? '',
                email: client.email || '',
                phone: client.phone || '',
                ...(standalone
                    ? { your_name: client.contact_name || '' }
                    : {}),
            });
        },
        [clients, setData, standalone],
    );

    const handleSdaTypeChange = useCallback(
        (values) => {
            setData(
                'sda_type_ids',
                Array.isArray(values) ? values.map(String) : [],
            );
        },
        [setData],
    );

    const submit = (e) => {
        e.preventDefault();
        post(storeRoute, {
            forceFormData: true,
        });
    };

    return (
        <Layout title={pageTitle}>
            {!standalone && <Head title={pageTitle} />}

            <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-5 pb-12 sm:space-y-6">
                {!standalone && listBackUrl && (
                    <div>
                        <Link
                            href={listBackUrl}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            ← Back to Masterlist
                        </Link>
                    </div>
                )}

                {standalone && submitted ? (
                    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:px-10">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            Thank you!
                        </h1>
                        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                            Your drafting request has been submitted successfully.
                            Our team will review it shortly.
                        </p>
                    </div>
                ) : (
                    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="border-b border-slate-200 px-4 py-6 dark:border-slate-700 sm:px-6 sm:py-8 lg:px-10">
                            <div className="flex flex-wrap items-start gap-6">
                                {!standalone && (
                                    <AppLogo
                                        logoUrl={logoUrl}
                                        alt="Bluinq"
                                        className="h-12 w-auto object-contain sm:h-14"
                                        fallback={null}
                                    />
                                )}
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                        {pageTitle}
                                    </h1>
                                    <p className="mt-2 max-w-[85ch] text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                                        Thank you for using BLUINQ for your
                                        architectural documentation. Please
                                        complete the form below.
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
                                        </InputLabel>
                                    }
                                    error={errors.requested_at}
                                >
                                    <TextInput
                                        id="requested_at"
                                        type="datetime-local"
                                        className={inputClass}
                                        value={data.requested_at ?? ''}
                                        onChange={(e) =>
                                            setData(
                                                'requested_at',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </FieldBlock>

                                <FieldBlock
                                    label={
                                        <InputLabel value="2. Your Name" />
                                    }
                                    hint={
                                        standalone
                                            ? 'From the selected client.'
                                            : 'Logged-in user.'
                                    }
                                    error={errors.your_name}
                                >
                                    <DisplayValue
                                        value={
                                            standalone
                                                ? data.your_name
                                                : loggedInName || data.your_name
                                        }
                                    />
                                </FieldBlock>

                                <FieldBlock
                                    label={
                                        <InputLabel htmlFor="client_id">
                                            3. Client Name
                                            <ReqMark />
                                        </InputLabel>
                                    }
                                    hint="Active clients from Workflow settings → Clients."
                                    error={
                                        errors.client_id ??
                                        errors.company_name ??
                                        errors.email ??
                                        errors.phone
                                    }
                                >
                                    <div className="select2-field">
                                        <Select2
                                            id="client_id"
                                            value={data.client_id}
                                            onChange={handleClientChange}
                                            options={clientOptions}
                                            placeholder="Select client…"
                                            allowClear
                                            required
                                        />
                                    </div>
                                    {clients.length === 0 ? (
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            No active clients configured. Add
                                            them under Workflow settings →
                                            Clients.
                                        </p>
                                    ) : null}
                                </FieldBlock>

                                <FieldBlock
                                    label={
                                        <InputLabel value="Client contact" />
                                    }
                                    hint="From the selected client."
                                >
                                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                                        <div className="min-w-0 space-y-1">
                                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                Contact name
                                            </dt>
                                            <dd>
                                                <DisplayValue
                                                    value={
                                                        selectedClient?.contact_name
                                                    }
                                                />
                                            </dd>
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                Email
                                            </dt>
                                            <dd>
                                                <DisplayValue
                                                    value={data.email}
                                                />
                                            </dd>
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                Phone
                                            </dt>
                                            <dd>
                                                <DisplayValue
                                                    value={data.phone}
                                                />
                                            </dd>
                                        </div>
                                    </dl>
                                </FieldBlock>
                            </FormRow>

                            <FormRow>
                                <FieldBlock
                                    className="lg:col-span-2"
                                    label={
                                        <InputLabel htmlFor="crm_category_id">
                                            4. Category
                                            <ReqMark />
                                        </InputLabel>
                                    }
                                    hint="Options from Workflow settings → Category."
                                    error={errors.crm_category_id}
                                >
                                    <select
                                        id="crm_category_id"
                                        className={selectClass}
                                        value={data.crm_category_id}
                                        onChange={(e) =>
                                            setData(
                                                'crm_category_id',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option value="">Select…</option>
                                        {categories.map((row) => (
                                            <option key={row.id} value={row.id}>
                                                {row.code
                                                    ? `${row.code} — ${row.name}`
                                                    : row.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        For job material documents/files —
                                        please email or upload them to
                                        SharePoint. Incomplete files can affect
                                        deliverable accuracy.
                                    </p>
                                    {categories.length === 0 ? (
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            No categories configured. Add them
                                            under Workflow settings → Category.
                                        </p>
                                    ) : null}
                                </FieldBlock>
                            </FormRow>

                            <FormRow>
                                <FieldBlock
                                    label={
                                        <InputLabel htmlFor="site_address">
                                            5. Site Address Details
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
                                        <InputLabel htmlFor="council_shire">
                                            6. Council / Shire
                                        </InputLabel>
                                    }
                                    error={errors.council_shire}
                                >
                                    <TextInput
                                        id="council_shire"
                                        className={inputClass}
                                        value={data.council_shire}
                                        onChange={(e) =>
                                            setData(
                                                'council_shire',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter council or shire"
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
                                            8. Area (m²)
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
                            </div>

                            <FormRow>
                                <FieldBlock
                                    label={
                                        <InputLabel htmlFor="building_class_id">
                                            9. Building Class
                                            <ReqMark />
                                        </InputLabel>
                                    }
                                    hint="Options from Workflow settings → Building Classes."
                                    error={errors.building_class_id}
                                >
                                    <select
                                        id="building_class_id"
                                        className={selectClass}
                                        value={data.building_class_id}
                                        onChange={(e) =>
                                            setData(
                                                'building_class_id',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option value="">Select…</option>
                                        {buildingClasses.map((row) => (
                                            <option key={row.id} value={row.id}>
                                                {row.code
                                                    ? `${row.code} — ${row.name}`
                                                    : row.name}
                                            </option>
                                        ))}
                                    </select>
                                    {buildingClasses.length === 0 ? (
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            No building classes configured. Add
                                            them under Workflow settings →
                                            Building Classes.
                                        </p>
                                    ) : null}
                                </FieldBlock>

                                <FieldBlock
                                    label={
                                        <InputLabel htmlFor="storey_level_id">
                                            10. Storey / Levels
                                            <ReqMark />
                                        </InputLabel>
                                    }
                                    hint="Options from Workflow settings → Typical Storeys & Levels."
                                    error={errors.storey_level_id}
                                >
                                    <select
                                        id="storey_level_id"
                                        className={selectClass}
                                        value={data.storey_level_id}
                                        onChange={(e) =>
                                            setData(
                                                'storey_level_id',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option value="">Select…</option>
                                        {storeyLevels.map((row) => (
                                            <option key={row.id} value={row.id}>
                                                {row.code
                                                    ? `${row.code} — ${row.name}`
                                                    : row.name}
                                            </option>
                                        ))}
                                    </select>
                                    {storeyLevels.length === 0 ? (
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            No storey / levels configured. Add
                                            them under Workflow settings →
                                            Typical Storeys & Levels.
                                        </p>
                                    ) : null}
                                </FieldBlock>
                            </FormRow>

                            <div className="flex w-full min-w-0 flex-col gap-8 lg:gap-10">
                                <FieldBlock
                                    label={
                                        <InputLabel htmlFor="zoning">
                                            11. Zoning
                                        </InputLabel>
                                    }
                                    hint="e.g. R2, R3, Mixed Use, Commercial…"
                                    error={errors.zoning}
                                >
                                    <TextInput
                                        id="zoning"
                                        className={inputClass}
                                        value={data.zoning}
                                        onChange={(e) =>
                                            setData('zoning', e.target.value)
                                        }
                                        placeholder="Enter zoning"
                                    />
                                </FieldBlock>
                            </div>

                            <FormRow>
                                <FieldBlock
                                    label={
                                        <InputLabel htmlFor="sda_type_ids">
                                            12. NDIS – SDA Dwelling (Class 3)
                                        </InputLabel>
                                    }
                                    hint="Select SDA types if this is an NDIS requirement dwelling. You can select multiple."
                                    error={
                                        errors.sda_type_ids ??
                                        errors['sda_type_ids.0'] ??
                                        errors.ndis_sda
                                    }
                                >
                                    <div className="select2-field w-full">
                                        <Select2
                                            id="sda_type_ids"
                                            multiple
                                            value={data.sda_type_ids}
                                            onChange={handleSdaTypeChange}
                                            options={sdaTypeOptions}
                                            placeholder="Select SDA types…"
                                        />
                                    </div>
                                    {sdaTypes.length === 0 ? (
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            No SDA types configured. Add them
                                            under Workflow settings → SDA Type.
                                        </p>
                                    ) : null}
                                </FieldBlock>

                                <FieldBlock
                                    label={
                                        <InputLabel htmlFor="external_wall_construction_id">
                                            13. External Wall Construction
                                        </InputLabel>
                                    }
                                    hint="Options from Workflow settings → External wall construction."
                                    error={
                                        errors.external_wall_construction_id
                                    }
                                >
                                    <select
                                        id="external_wall_construction_id"
                                        className={selectClass}
                                        value={
                                            data.external_wall_construction_id
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'external_wall_construction_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">Select…</option>
                                        {externalWallConstructions.map(
                                            (row) => (
                                                <option
                                                    key={row.id}
                                                    value={row.id}
                                                >
                                                    {row.name}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </FieldBlock>
                            </FormRow>

                            <FieldBlock
                                className="w-full"
                                label={
                                    <InputLabel htmlFor="documents">
                                        14. Upload documents
                                    </InputLabel>
                                }
                                hint={
                                    <span>
                                        The Engaged Party must give the
                                        following material documents/files:
                                        <ul className="mt-2 list-disc space-y-1 ps-5">
                                            <li>
                                                Company/title block template
                                                (PLN/DWG).
                                            </li>
                                            <li>
                                                All necessary information and/or
                                                instructions to be given upon
                                                engagement; any design charges
                                                after commencement of work will
                                                be treated as revision.
                                            </li>
                                            <li>
                                                Sample of previous jobs to
                                                assist with our formatting.
                                            </li>
                                        </ul>
                                    </span>
                                }
                                error={
                                    errors.documents ?? errors['documents.0']
                                }
                            >
                                <label className={uploadZoneClass}>
                                    <ArrowUpTrayIcon
                                        className="mb-2 h-10 w-10 text-slate-400"
                                        aria-hidden
                                    />
                                    <span
                                        className={`${mutedTextClass} text-sm`}
                                    >
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
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
                                    <ul className={`mt-2 ${mutedTextClass}`}>
                                        {data.documents.map((f, i) => (
                                            <li key={i}>{f.name}</li>
                                        ))}
                                    </ul>
                                ) : null}
                            </FieldBlock>

                            <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-8 dark:border-slate-700">
                                <PrimaryButton
                                    type="submit"
                                    loading={processing}
                                >
                                    {isEdit
                                        ? 'Save changes'
                                        : 'Submit request'}
                                </PrimaryButton>
                                {!standalone && listBackUrl && (
                                    <Link
                                        href={listBackUrl}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                    >
                                        Cancel
                                    </Link>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </Layout>
    );
}
