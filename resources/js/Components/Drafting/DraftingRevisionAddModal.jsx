import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select2 from '@/Components/Select2';
import TextInput from '@/Components/TextInput';
import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';

function listQueryString(listFilters = {}) {
    const p = new URLSearchParams();
    if (listFilters.search) {
        p.set('search', listFilters.search);
    }
    if (listFilters.per_page) {
        p.set('per_page', String(listFilters.per_page));
    }
    if (listFilters.from === 'archive') {
        p.set('from', 'archive');
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

function suggestNextRevisionCode(jobNumber, revisions = []) {
    const base = String(jobNumber ?? '').trim();
    if (base === '') {
        return '';
    }

    const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const suffixPattern = new RegExp(`^${escaped}-(\\d{2})$`);
    let maxSuffix = 0;

    for (const revision of revisions) {
        const code = String(revision.code ?? '').trim();
        const match = code.match(suffixPattern);
        if (match) {
            maxSuffix = Math.max(maxSuffix, Number.parseInt(match[1], 10));
        }
    }

    return `${base}-${String(maxSuffix + 1).padStart(2, '0')}`;
}

export default function DraftingRevisionAddModal({
    show = false,
    onClose,
    draftingRequestId,
    listFilters = {},
    drafterUsers = [],
    entry = null,
    jobNumber = '',
    revisions = [],
    statusOptions = [],
    categoryOptions = [],
    defaultJobStatus = 'new',
}) {
    const { auth, categoryOptions: pageCategoryOptions = [] } = usePage().props;
    const categories =
        categoryOptions.length > 0 ? categoryOptions : pageCategoryOptions;

    const categorySelectOptions = useMemo(() => {
        const items = categories.map((option) => ({
            value: option.name,
            label: option.name,
        }));

        if (
            entry?.category &&
            !items.some((option) => option.value === entry.category)
        ) {
            items.unshift({
                value: entry.category,
                label: entry.category,
            });
        }

        return items;
    }, [categories, entry?.category]);

    const userSelectOptions = useMemo(
        () =>
            drafterUsers.map((user) => ({
                value: String(user.id),
                label: `${user.name}${
                    user.initials ? ` (${user.initials})` : ''
                }`,
            })),
        [drafterUsers],
    );

    const statusSelectOptions = useMemo(
        () =>
            statusOptions.map((option) => ({
                value: option.value,
                label: option.label,
            })),
        [statusOptions],
    );
    const listQs = listQueryString(listFilters);
    const isEditing = entry != null;

    const form = useForm({
        code: '',
        log_date: '',
        category: '',
        drafter_user_id: '',
        drafting_hours: '',
        checking_hours: '',
        status: defaultJobStatus || 'new',
        area_size: '',
        submitted_date: '',
    });

    useEffect(() => {
        if (!show) {
            form.reset();
            form.clearErrors();
            return;
        }

        if (entry) {
            form.setData({
                code: entry.code ?? '',
                log_date: entry.log_date_value ?? '',
                category: entry.category ?? '',
                drafter_user_id: entry.drafter_user_id
                    ? String(entry.drafter_user_id)
                    : '',
                drafting_hours: entry.drafting_hours ?? '',
                checking_hours: entry.checking_hours ?? '',
                status: entry.status ?? '',
                area_size: entry.area_size ?? '',
                submitted_date: entry.submitted_date_value ?? '',
            });

            return;
        }

        const currentUserId = auth?.user?.id;
        const defaultDrafter =
            currentUserId &&
            drafterUsers.some((user) => user.id === currentUserId)
                ? String(currentUserId)
                : '';

        form.setData({
            code: suggestNextRevisionCode(jobNumber, revisions),
            log_date: '',
            category: '',
            drafter_user_id: defaultDrafter,
            drafting_hours: '',
            checking_hours: '',
            status: defaultJobStatus || 'new',
            area_size: '',
            submitted_date: '',
        });
    }, [show, auth?.user?.id, drafterUsers, entry, jobNumber, revisions, defaultJobStatus]);

    const submit = (e) => {
        e.preventDefault();

        if (isEditing) {
            form.patch(
                route('job.drafting.revisions.update', [
                    draftingRequestId,
                    entry.id,
                ]) + listQs,
                {
                    preserveScroll: true,
                    onSuccess: () => onClose(),
                },
            );

            return;
        }

        form.post(
            route('job.drafting.revisions.store', draftingRequestId) + listQs,
            {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    onClose();
                },
            },
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-[#323338] dark:text-white">
                    {isEditing ? 'Edit item' : 'Add item'}
                </h2>
                <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                    {isEditing
                        ? 'Update this revision entry for this job.'
                        : 'Record a new revision entry. This will appear in the table and activity log.'}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="revision-code" value="Job Number" />
                        <TextInput
                            id="revision-code"
                            value={form.data.code}
                            onChange={(e) =>
                                form.setData('code', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="e.g. 26003-01"
                            readOnly={!isEditing}
                            required
                        />
                        <InputError
                            message={form.errors.code}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="revision-log-date" value="Log date" />
                        <TextInput
                            id="revision-log-date"
                            type="date"
                            value={form.data.log_date}
                            onChange={(e) =>
                                form.setData('log_date', e.target.value)
                            }
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError
                            message={form.errors.log_date}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="revision-submitted-date"
                            value="Submitted date"
                        />
                        <TextInput
                            id="revision-submitted-date"
                            type="date"
                            value={form.data.submitted_date}
                            onChange={(e) =>
                                form.setData('submitted_date', e.target.value)
                            }
                            className="mt-1 block w-full"
                        />
                        <InputError
                            message={form.errors.submitted_date}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="revision-category"
                            value="Category"
                        />
                        <div className="mt-1 select2-field">
                            <Select2
                                id="revision-category"
                                value={form.data.category}
                                onChange={(value) =>
                                    form.setData('category', value)
                                }
                                options={categorySelectOptions}
                                placeholder="Select category…"
                                enabled={show}
                            />
                        </div>
                        <InputError
                            message={form.errors.category}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="revision-user" value="User" />
                        <div className="mt-1 select2-field">
                            <Select2
                                id="revision-user"
                                value={form.data.drafter_user_id}
                                onChange={(value) =>
                                    form.setData('drafter_user_id', value)
                                }
                                options={userSelectOptions}
                                placeholder="Select user…"
                                enabled={show}
                                required
                            />
                        </div>
                        <InputError
                            message={form.errors.drafter_user_id}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="revision-drafting-hours"
                            value="Drafting hours"
                        />
                        <TextInput
                            id="revision-drafting-hours"
                            type="number"
                            min="0"
                            step="0.25"
                            value={form.data.drafting_hours}
                            onChange={(e) =>
                                form.setData('drafting_hours', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="Optional"
                        />
                        <InputError
                            message={form.errors.drafting_hours}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="revision-checking-hours"
                            value="Checking hours"
                        />
                        <TextInput
                            id="revision-checking-hours"
                            type="number"
                            min="0"
                            step="0.25"
                            value={form.data.checking_hours}
                            onChange={(e) =>
                                form.setData('checking_hours', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="Optional"
                        />
                        <InputError
                            message={form.errors.checking_hours}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="revision-status" value="Status" />
                        <div className="mt-1 select2-field">
                            <Select2
                                id="revision-status"
                                value={form.data.status}
                                onChange={(value) =>
                                    form.setData('status', value)
                                }
                                options={statusSelectOptions}
                                placeholder="Select status…"
                                enabled={show}
                                required
                            />
                        </div>
                        <InputError
                            message={form.errors.status}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="revision-area-size"
                            value="Area size"
                        />
                        <TextInput
                            id="revision-area-size"
                            value={form.data.area_size}
                            onChange={(e) =>
                                form.setData('area_size', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="e.g. 32 SQM"
                        />
                        <InputError
                            message={form.errors.area_size}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        className="rounded-lg normal-case tracking-normal"
                    >
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton
                        loading={form.processing}
                        className="rounded-lg normal-case tracking-normal"
                    >
                        {isEditing ? 'Save item' : 'Add item'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
