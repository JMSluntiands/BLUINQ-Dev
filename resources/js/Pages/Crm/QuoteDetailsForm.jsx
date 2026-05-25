import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLogo from '@/Components/AppLogo';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

function ReqMark() {
    return <span className="text-red-600"> *</span>;
}

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

export default function QuoteDetailsForm({
    defaults,
    arrivalInputFiles = [],
    categories = [],
    levelsOfDifficulty = [],
    buildingTypes = [],
    scopesOfWork = [],
    deliverables = [],
}) {
    const { logo_url: logoUrl } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        requested_at: defaults.requested_at,
        client_company_name: '',
        project_job_number: '',
        site_address: '',
        site_owner_name: '',
        arrival_input_file_id: '',
        crm_category_id: '',
        level_of_difficulty_id: '',
        building_type_id: '',
        scope_of_work_id: '',
        deliverable_id: '',
        building_area_size: '',
        estimated_time_allocation: '',
        remarks: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('crm.quote-form.store'));
    };

    const buildingAreaLen = data.building_area_size?.length ?? 0;
    const remarksLen = data.remarks?.length ?? 0;

    return (
        <AuthenticatedLayout>
            <Head title="Quote Details Form" />

            <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-5 pb-12 sm:space-y-6">
                <div>
                    <Link
                        href={route('crm.quotes')}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        ← Back to Quote List
                    </Link>
                </div>

                <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
                        <div className="flex flex-wrap items-start gap-6">
                            <AppLogo
                                logoUrl={logoUrl}
                                alt="Bluinq"
                                className="h-12 w-auto object-contain sm:h-14"
                                fallback={null}
                            />
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                    Quote Details Form
                                </h1>
                                <p className="mt-2 max-w-[85ch] text-sm leading-relaxed text-slate-600 sm:text-base">
                                    All pricing quoted are inclusion of 1x
                                    correction amendment, or unlimited BLUINQ's
                                    errors fix-up, unless otherwise stated (write
                                    down at the Remarks field).
                                </p>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={submit}
                        className="w-full min-w-0 space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:space-y-10 lg:px-10"
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
                                    <InputLabel htmlFor="client_company_name">
                                        2. Client/Customer Company Name
                                        <ReqMark />
                                    </InputLabel>
                                }
                                error={errors.client_company_name}
                            >
                                <TextInput
                                    id="client_company_name"
                                    className={inputClass}
                                    value={data.client_company_name}
                                    onChange={(e) =>
                                        setData(
                                            'client_company_name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </FieldBlock>
                        </FormRow>

                        <FormRow>
                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="project_job_number">
                                        3. Project/Job Number
                                    </InputLabel>
                                }
                                error={errors.project_job_number}
                            >
                                <TextInput
                                    id="project_job_number"
                                    className={inputClass}
                                    value={data.project_job_number}
                                    onChange={(e) =>
                                        setData(
                                            'project_job_number',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="site_address">
                                        4. Site Address
                                        <ReqMark />
                                    </InputLabel>
                                }
                                hint="Unit No. - Lot No. - Street No. - Street Name - Suburb - State - Postcode"
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
                        </FormRow>

                        <FieldBlock
                            className="w-full max-w-lg"
                            label={
                                <InputLabel htmlFor="site_owner_name">
                                    5. Site Owner name
                                </InputLabel>
                            }
                            error={errors.site_owner_name}
                        >
                            <TextInput
                                id="site_owner_name"
                                className={inputClass}
                                value={data.site_owner_name}
                                onChange={(e) =>
                                    setData('site_owner_name', e.target.value)
                                }
                            />
                        </FieldBlock>

                        <FormRow>
                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="arrival_input_file_id">
                                        6. Arrival Input Files
                                        <ReqMark />
                                    </InputLabel>
                                }
                                error={errors.arrival_input_file_id}
                            >
                                <select
                                    id="arrival_input_file_id"
                                    className={selectClass}
                                    value={data.arrival_input_file_id}
                                    onChange={(e) =>
                                        setData(
                                            'arrival_input_file_id',
                                            e.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">Select…</option>
                                    {arrivalInputFiles.map((row) => (
                                        <option key={row.id} value={row.id}>
                                            {row.name}
                                        </option>
                                    ))}
                                </select>
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="crm_category_id">
                                        7. Category
                                        <ReqMark />
                                    </InputLabel>
                                }
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
                                            {row.name}
                                        </option>
                                    ))}
                                </select>
                            </FieldBlock>
                        </FormRow>

                        <FormRow>
                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="level_of_difficulty_id">
                                        8. Level of Difficulty
                                        <ReqMark />
                                    </InputLabel>
                                }
                                error={errors.level_of_difficulty_id}
                            >
                                <select
                                    id="level_of_difficulty_id"
                                    className={selectClass}
                                    value={data.level_of_difficulty_id}
                                    onChange={(e) =>
                                        setData(
                                            'level_of_difficulty_id',
                                            e.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">Select…</option>
                                    {levelsOfDifficulty.map((row) => (
                                        <option key={row.id} value={row.id}>
                                            {row.name}
                                        </option>
                                    ))}
                                </select>
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="building_type_id">
                                        9. Building Type
                                        <ReqMark />
                                    </InputLabel>
                                }
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
                            </FieldBlock>
                        </FormRow>

                        <FormRow>
                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="scope_of_work_id">
                                        10. Scope of Work
                                        <ReqMark />
                                    </InputLabel>
                                }
                                error={errors.scope_of_work_id}
                            >
                                <select
                                    id="scope_of_work_id"
                                    className={selectClass}
                                    value={data.scope_of_work_id}
                                    onChange={(e) =>
                                        setData(
                                            'scope_of_work_id',
                                            e.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">Select…</option>
                                    {scopesOfWork.map((row) => (
                                        <option key={row.id} value={row.id}>
                                            {row.name}
                                        </option>
                                    ))}
                                </select>
                            </FieldBlock>

                            <FieldBlock
                                label={
                                    <InputLabel htmlFor="deliverable_id">
                                        11. Deliverables
                                        <ReqMark />
                                    </InputLabel>
                                }
                                error={errors.deliverable_id}
                            >
                                <select
                                    id="deliverable_id"
                                    className={selectClass}
                                    value={data.deliverable_id}
                                    onChange={(e) =>
                                        setData(
                                            'deliverable_id',
                                            e.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">Select…</option>
                                    {deliverables.map((row) => (
                                        <option key={row.id} value={row.id}>
                                            {row.name}
                                        </option>
                                    ))}
                                </select>
                            </FieldBlock>
                        </FormRow>

                        <FieldBlock
                            className="w-full"
                            label={
                                <InputLabel htmlFor="building_area_size">
                                    12. Building Area Size
                                    <ReqMark />
                                </InputLabel>
                            }
                            hint="Area in square meter (approx.)"
                            error={errors.building_area_size}
                        >
                            <textarea
                                id="building_area_size"
                                className={textareaClass}
                                maxLength={2000}
                                value={data.building_area_size}
                                onChange={(e) =>
                                    setData(
                                        'building_area_size',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            <p className="text-right text-xs text-slate-500">
                                {buildingAreaLen}/2000
                            </p>
                        </FieldBlock>

                        <FieldBlock
                            className="w-full max-w-lg"
                            label={
                                <InputLabel htmlFor="estimated_time_allocation">
                                    13. Estimated Time Allocation (ETA)
                                    <ReqMark />
                                </InputLabel>
                            }
                            hint="Ps. specify it, either hours, days, weeks"
                            error={errors.estimated_time_allocation}
                        >
                            <TextInput
                                id="estimated_time_allocation"
                                className={inputClass}
                                value={data.estimated_time_allocation}
                                onChange={(e) =>
                                    setData(
                                        'estimated_time_allocation',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                        </FieldBlock>

                        <FieldBlock
                            className="w-full"
                            label={
                                <InputLabel htmlFor="remarks">
                                    14. Remarks/Other Notes
                                </InputLabel>
                            }
                            hint="To included on the generated quote"
                            error={errors.remarks}
                        >
                            <textarea
                                id="remarks"
                                className={textareaClass}
                                maxLength={2000}
                                value={data.remarks}
                                onChange={(e) =>
                                    setData('remarks', e.target.value)
                                }
                            />
                            <p className="text-right text-xs text-slate-500">
                                {remarksLen}/2000
                            </p>
                        </FieldBlock>

                        <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-8">
                            <PrimaryButton type="submit" loading={processing}>
                                Submit
                            </PrimaryButton>
                            <Link
                                href={route('crm.quotes')}
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
