import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';

const selectClass =
    'mt-1 block w-full rounded-md border-[#c5c7d0] text-sm shadow-sm focus:border-[#0073ea] focus:ring-[#0073ea]';
const textareaClass =
    'mt-1 block w-full rounded-md border-[#c5c7d0] text-sm shadow-sm focus:border-[#0073ea] focus:ring-[#0073ea]';

const SECTION_TITLES = {
    client: 'Edit client details',
    job: 'Edit job details',
    building: 'Edit building specifications',
    notes: 'Edit notes',
};

export default function DraftingEditModals({
    section,
    onClose,
    draftingRequest,
    formOptions = {},
    statusOptions = [],
    updateUrl,
}) {
    const clientForm = useForm({
        section: 'client',
        your_name: draftingRequest.your_name ?? '',
        company_name: draftingRequest.company_name ?? '',
        email: draftingRequest.email ?? '',
    });

    const jobForm = useForm({
        section: 'job',
        status: draftingRequest.status ?? 'new',
        building_type_id: draftingRequest.building_type_id ?? '',
        zoning: draftingRequest.zoning ?? '',
        site_address: draftingRequest.site_address ?? '',
        service_engaging_ids: draftingRequest.service_engaging_ids ?? [],
        ndis_sda: draftingRequest.ndis_sda ?? false,
        external_wall_construction_id:
            draftingRequest.external_wall_construction_id ?? '',
        roof_type_id: draftingRequest.roof_type_id ?? '',
        ceiling_heights: draftingRequest.ceiling_heights ?? '',
        first_floor_slab: draftingRequest.first_floor_slab ?? '',
        design_requirements: draftingRequest.design_requirements ?? '',
        additional_inclusions: draftingRequest.additional_inclusions ?? '',
    });

    const buildingForm = useForm({
        section: 'building',
        site_owner_name: draftingRequest.site_owner_name ?? '',
        external_wall_construction_id:
            draftingRequest.external_wall_construction_id ?? '',
        roof_type_id: draftingRequest.roof_type_id ?? '',
        ceiling_heights: draftingRequest.ceiling_heights ?? '',
        first_floor_slab: draftingRequest.first_floor_slab ?? '',
    });

    const notesForm = useForm({
        section: 'notes',
        design_requirements: draftingRequest.design_requirements ?? '',
        additional_inclusions: draftingRequest.additional_inclusions ?? '',
    });

    const submit = (form) => {
        form.patch(updateUrl, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const toggleService = (form, id) => {
        const ids = form.data.service_engaging_ids;
        const n = Number(id);
        if (ids.includes(n)) {
            form.setData(
                'service_engaging_ids',
                ids.filter((x) => x !== n),
            );
        } else {
            form.setData('service_engaging_ids', [...ids, n]);
        }
    };

    return (
        <Modal
            show={section != null}
            onClose={onClose}
            maxWidth="2xl"
        >
            {section === 'client' ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit(clientForm);
                    }}
                    className="p-6"
                >
                    <ModalHeader
                        title={SECTION_TITLES.client}
                        onClose={onClose}
                    />
                    <div className="mt-4 space-y-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                Log date
                            </p>
                            <p className="mt-1 text-sm text-[#323338]">
                                {draftingRequest.requested_at ?? '—'}
                            </p>
                        </div>
                        <div>
                            <InputLabel htmlFor="edit-company_name" value="Client" />
                            <TextInput
                                id="edit-company_name"
                                className="mt-1 block w-full"
                                value={clientForm.data.company_name}
                                onChange={(e) =>
                                    clientForm.setData(
                                        'company_name',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            <InputError
                                className="mt-2"
                                message={clientForm.errors.company_name}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit-your_name" value="Contact name" />
                            <TextInput
                                id="edit-your_name"
                                className="mt-1 block w-full"
                                value={clientForm.data.your_name}
                                onChange={(e) =>
                                    clientForm.setData('your_name', e.target.value)
                                }
                                required
                            />
                            <InputError
                                className="mt-2"
                                message={clientForm.errors.your_name}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit-email" value="Email" />
                            <TextInput
                                id="edit-email"
                                type="email"
                                className="mt-1 block w-full"
                                value={clientForm.data.email}
                                onChange={(e) =>
                                    clientForm.setData('email', e.target.value)
                                }
                                required
                            />
                            <InputError
                                className="mt-2"
                                message={clientForm.errors.email}
                            />
                        </div>
                    </div>
                    <ModalFooter
                        onClose={onClose}
                        processing={clientForm.processing}
                    />
                </form>
            ) : null}

            {section === 'job' ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit(jobForm);
                    }}
                    className="flex max-h-[85vh] flex-col p-5"
                >
                    <ModalHeader title={SECTION_TITLES.job} onClose={onClose} />
                    <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="edit-status" value="JOB STATUS" />
                            <select
                                id="edit-status"
                                className={selectClass}
                                value={jobForm.data.status}
                                onChange={(e) =>
                                    jobForm.setData('status', e.target.value)
                                }
                            >
                                {statusOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                className="mt-2"
                                message={jobForm.errors.status}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit-building_type_id" value="Building type" />
                            <select
                                id="edit-building_type_id"
                                className={selectClass}
                                value={jobForm.data.building_type_id}
                                onChange={(e) =>
                                    jobForm.setData(
                                        'building_type_id',
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="">Select…</option>
                                {(formOptions.buildingTypes ?? []).map((row) => (
                                    <option key={row.id} value={row.id}>
                                        {row.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                className="mt-2"
                                message={jobForm.errors.building_type_id}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit-zoning" value="Zoning" />
                            <TextInput
                                id="edit-zoning"
                                className="mt-1 block w-full"
                                value={jobForm.data.zoning}
                                onChange={(e) =>
                                    jobForm.setData('zoning', e.target.value)
                                }
                            />
                            <InputError
                                className="mt-1"
                                message={jobForm.errors.zoning}
                            />
                        </div>
                        <div>
                            <InputLabel value="NDIS / SDA" />
                            <label className="mt-1 flex h-10 items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="rounded border-[#c5c7d0] text-[#0073ea] focus:ring-[#0073ea]"
                                    checked={jobForm.data.ndis_sda}
                                    onChange={(e) =>
                                        jobForm.setData(
                                            'ndis_sda',
                                            e.target.checked,
                                        )
                                    }
                                />
                                <span className="text-sm font-medium text-[#323338] dark:text-slate-200">
                                    NDIS / SDA dwelling
                                </span>
                            </label>
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="edit-site_address" value="Address" />
                            <textarea
                                id="edit-site_address"
                                className={textareaClass}
                                rows={2}
                                value={jobForm.data.site_address}
                                onChange={(e) =>
                                    jobForm.setData('site_address', e.target.value)
                                }
                                required
                            />
                            <InputError
                                className="mt-2"
                                message={jobForm.errors.site_address}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel value="Services" />
                            <ul className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {(formOptions.serviceEngagings ?? []).map((row) => (
                                    <li key={row.id}>
                                        <label className="flex cursor-pointer items-start gap-1.5 rounded-md border border-[#e6e9ef] bg-[#fafbfc] px-2 py-1.5 dark:border-[#2f3347] dark:bg-[#151622]">
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 rounded border-[#c5c7d0] text-[#0073ea] focus:ring-[#0073ea]"
                                                checked={jobForm.data.service_engaging_ids.some(
                                                    (id) =>
                                                        Number(id) ===
                                                        Number(row.id),
                                                )}
                                                onChange={() =>
                                                    toggleService(jobForm, row.id)
                                                }
                                            />
                                            <span className="text-xs text-[#323338] dark:text-slate-200">
                                                {row.name}
                                            </span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                            <InputError
                                className="mt-2"
                                message={
                                    jobForm.errors.service_engaging_ids ??
                                    jobForm.errors['service_engaging_ids.0']
                                }
                            />
                        </div>
                        <div className="sm:col-span-2 border-t border-[#e6e9ef] pt-3 dark:border-[#2f3347]">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#676879] dark:text-slate-400">
                                Building specifications
                            </p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="edit-job-external_wall"
                                        value="External wall"
                                    />
                                    <select
                                        id="edit-job-external_wall"
                                        className={selectClass}
                                        value={
                                            jobForm.data
                                                .external_wall_construction_id
                                        }
                                        onChange={(e) =>
                                            jobForm.setData(
                                                'external_wall_construction_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">Select…</option>
                                        {(
                                            formOptions.externalWallConstructions ??
                                            []
                                        ).map((row) => (
                                            <option key={row.id} value={row.id}>
                                                {row.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        className="mt-2"
                                        message={
                                            jobForm.errors
                                                .external_wall_construction_id
                                        }
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="edit-job-roof_type"
                                        value="Roof"
                                    />
                                    <select
                                        id="edit-job-roof_type"
                                        className={selectClass}
                                        value={jobForm.data.roof_type_id}
                                        onChange={(e) =>
                                            jobForm.setData(
                                                'roof_type_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">Select…</option>
                                        {(formOptions.roofTypes ?? []).map(
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
                                    <InputError
                                        className="mt-2"
                                        message={jobForm.errors.roof_type_id}
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="edit-job-ceiling"
                                        value="Ceiling heights"
                                    />
                                    <textarea
                                        id="edit-job-ceiling"
                                        className={textareaClass}
                                        rows={2}
                                        value={jobForm.data.ceiling_heights}
                                        onChange={(e) =>
                                            jobForm.setData(
                                                'ceiling_heights',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={jobForm.errors.ceiling_heights}
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="edit-job-slab"
                                        value="First floor slab"
                                    />
                                    <textarea
                                        id="edit-job-slab"
                                        className={textareaClass}
                                        rows={2}
                                        value={jobForm.data.first_floor_slab}
                                        onChange={(e) =>
                                            jobForm.setData(
                                                'first_floor_slab',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={jobForm.errors.first_floor_slab}
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="edit-job-design_requirements"
                                        value="Design requirements"
                                    />
                                    <textarea
                                        id="edit-job-design_requirements"
                                        className={textareaClass}
                                        rows={2}
                                        maxLength={2000}
                                        value={jobForm.data.design_requirements}
                                        onChange={(e) =>
                                            jobForm.setData(
                                                'design_requirements',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={
                                            jobForm.errors.design_requirements
                                        }
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="edit-job-additional_inclusions"
                                        value="Additional inclusions"
                                    />
                                    <textarea
                                        id="edit-job-additional_inclusions"
                                        className={textareaClass}
                                        rows={2}
                                        maxLength={2000}
                                        value={jobForm.data.additional_inclusions}
                                        onChange={(e) =>
                                            jobForm.setData(
                                                'additional_inclusions',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={
                                            jobForm.errors.additional_inclusions
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    <ModalFooter
                        onClose={onClose}
                        processing={jobForm.processing}
                        className="mt-4 shrink-0"
                    />
                </form>
            ) : null}

            {section === 'building' ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit(buildingForm);
                    }}
                    className="p-6"
                >
                    <ModalHeader
                        title={SECTION_TITLES.building}
                        onClose={onClose}
                    />
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="edit-site_owner" value="Site owner" />
                            <TextInput
                                id="edit-site_owner"
                                className="mt-1 block w-full"
                                value={buildingForm.data.site_owner_name}
                                onChange={(e) =>
                                    buildingForm.setData(
                                        'site_owner_name',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            <InputError
                                className="mt-2"
                                message={buildingForm.errors.site_owner_name}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit-external_wall" value="External wall" />
                            <select
                                id="edit-external_wall"
                                className={selectClass}
                                value={buildingForm.data.external_wall_construction_id}
                                onChange={(e) =>
                                    buildingForm.setData(
                                        'external_wall_construction_id',
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">Select…</option>
                                {(
                                    formOptions.externalWallConstructions ?? []
                                ).map((row) => (
                                    <option key={row.id} value={row.id}>
                                        {row.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                className="mt-2"
                                message={
                                    buildingForm.errors.external_wall_construction_id
                                }
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit-roof_type" value="Roof type" />
                            <select
                                id="edit-roof_type"
                                className={selectClass}
                                value={buildingForm.data.roof_type_id}
                                onChange={(e) =>
                                    buildingForm.setData('roof_type_id', e.target.value)
                                }
                            >
                                <option value="">Select…</option>
                                {(formOptions.roofTypes ?? []).map((row) => (
                                    <option key={row.id} value={row.id}>
                                        {row.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                className="mt-2"
                                message={buildingForm.errors.roof_type_id}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="edit-ceiling" value="Ceiling heights" />
                            <textarea
                                id="edit-ceiling"
                                className={textareaClass}
                                rows={2}
                                value={buildingForm.data.ceiling_heights}
                                onChange={(e) =>
                                    buildingForm.setData(
                                        'ceiling_heights',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            <InputError
                                className="mt-2"
                                message={buildingForm.errors.ceiling_heights}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="edit-slab" value="First floor slab" />
                            <textarea
                                id="edit-slab"
                                className={textareaClass}
                                rows={2}
                                value={buildingForm.data.first_floor_slab}
                                onChange={(e) =>
                                    buildingForm.setData(
                                        'first_floor_slab',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                className="mt-2"
                                message={buildingForm.errors.first_floor_slab}
                            />
                        </div>
                    </div>
                    <ModalFooter
                        onClose={onClose}
                        processing={buildingForm.processing}
                    />
                </form>
            ) : null}

            {section === 'notes' ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit(notesForm);
                    }}
                    className="p-6"
                >
                    <ModalHeader title={SECTION_TITLES.notes} onClose={onClose} />
                    <div className="mt-4 space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="edit-design_requirements"
                                value="Design requirements"
                            />
                            <textarea
                                id="edit-design_requirements"
                                className={textareaClass}
                                rows={4}
                                maxLength={2000}
                                value={notesForm.data.design_requirements}
                                onChange={(e) =>
                                    notesForm.setData(
                                        'design_requirements',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                className="mt-2"
                                message={notesForm.errors.design_requirements}
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="edit-additional_inclusions"
                                value="Additional inclusions"
                            />
                            <textarea
                                id="edit-additional_inclusions"
                                className={textareaClass}
                                rows={4}
                                maxLength={2000}
                                value={notesForm.data.additional_inclusions}
                                onChange={(e) =>
                                    notesForm.setData(
                                        'additional_inclusions',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                className="mt-2"
                                message={notesForm.errors.additional_inclusions}
                            />
                        </div>
                    </div>
                    <ModalFooter
                        onClose={onClose}
                        processing={notesForm.processing}
                    />
                </form>
            ) : null}
        </Modal>
    );
}

function ModalHeader({ title, onClose }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#323338]">{title}</h2>
            <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-[#676879] hover:text-[#323338]"
            >
                Close
            </button>
        </div>
    );
}

function ModalFooter({ onClose, processing, className = '' }) {
    return (
        <div
            className={`mt-6 flex flex-wrap justify-end gap-2 ${className}`}
        >
            <SecondaryButton
                type="button"
                onClick={onClose}
                className="rounded-lg normal-case tracking-normal"
            >
                Cancel
            </SecondaryButton>
            <PrimaryButton
                loading={processing}
                className="rounded-lg normal-case tracking-normal !bg-[#0073ea] hover:!bg-[#0060c4]"
            >
                Save
            </PrimaryButton>
        </div>
    );
}
