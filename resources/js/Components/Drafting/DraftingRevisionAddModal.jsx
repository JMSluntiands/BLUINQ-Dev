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
    if (listFilters.from === 'archive' || listFilters.from === 'masterlist') {
        p.set('from', listFilters.from);
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

export function suggestNextRevisionCode(jobNumber, revisions = []) {
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
            continue;
        }

        // Legacy first revisions were stored without "-01".
        if (code === base) {
            maxSuffix = Math.max(maxSuffix, 1);
        }
    }

    return `${base}-${String(maxSuffix + 1).padStart(2, '0')}`;
}

/**
 * Slim revision modal (APM-owned staffing fields live on the board).
 * Fields: Revision Number, Revision Link, Category, Date In, Status.
 */
export default function DraftingRevisionAddModal({
    show = false,
    onClose,
    draftingRequestId,
    listFilters = {},
    entry = null,
    jobNumber = '',
    revisions = [],
    statusOptions = [],
    categoryOptions = [],
    defaultJobStatus = 'new',
}) {
    const { categoryOptions: pageCategoryOptions = [] } = usePage().props;
    const categories =
        categoryOptions.length > 0 ? categoryOptions : pageCategoryOptions;

    const categorySelectOptions = useMemo(() => {
        const items = categories.map((option) => {
            const code = option.code || option.name;
            return {
                value: code,
                label:
                    option.name && option.name !== code
                        ? `${code} — ${option.name}`
                        : code,
            };
        });

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
        link: '',
        log_date: '',
        category: '',
        status: defaultJobStatus || 'new',
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
                link: entry.link ?? '',
                log_date: entry.log_date_value ?? '',
                category: entry.category ?? '',
                status: entry.status ?? '',
            });

            return;
        }

        form.setData({
            code: suggestNextRevisionCode(jobNumber, revisions),
            link: '',
            log_date: '',
            category: '',
            status: defaultJobStatus || 'new',
        });
    }, [show, entry, jobNumber, revisions, defaultJobStatus]);

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
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-[#323338] dark:text-white">
                    {isEditing ? 'Edit item' : 'Add from masterlist'}
                </h2>
                <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                    {isEditing
                        ? 'Update revision number, link, category, date in, and status. Drafter, hours, and date out are set on the board.'
                        : 'Add a revision. Assign drafter, checker, and hours on the Project Management board.'}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel
                            htmlFor="revision-code"
                            value="Revision Number"
                        />
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
                        <InputLabel
                            htmlFor="revision-link"
                            value="Revision Link"
                        />
                        <TextInput
                            id="revision-link"
                            type="url"
                            value={form.data.link}
                            onChange={(e) =>
                                form.setData('link', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="https://…"
                        />
                        <InputError
                            message={form.errors.link}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="revision-log-date" value="Date In" />
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
                        {isEditing ? 'Save item' : 'Add from masterlist'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
