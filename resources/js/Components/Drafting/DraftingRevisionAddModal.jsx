import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select2 from '@/Components/Select2';
import TextInput from '@/Components/TextInput';
import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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

export function leadNumberBase(jobNumber, revisions = []) {
    const raw = String(jobNumber ?? '').trim();
    const stripped = raw.replace(/-\d{2}$/, '');
    if (stripped !== '') {
        return stripped;
    }

    for (const revision of revisions) {
        const code = String(revision?.code ?? '').trim();
        const match = code.match(/^(\d{5})(?:-\d{2})?$/);
        if (match) {
            return match[1];
        }
    }

    return '';
}

export function suggestNextRevisionCode(jobNumber, revisions = []) {
    const base = leadNumberBase(jobNumber, revisions);
    if (base === '') {
        return '';
    }

    const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const suffixPattern = new RegExp(`^${escaped}-(\\d{2})$`);
    let maxSuffix = 0;

    for (const revision of revisions) {
        const code = String(revision?.code ?? '').trim();
        if (code === '' || code === '—') {
            continue;
        }

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
 * Fields: optional Project, Revision Number, Revision Link, Category, Date In, Status.
 * mode="forward" — pick a masterlist/APM candidate then review before adding to board.
 */
export default function DraftingRevisionAddModal({
    show = false,
    onClose,
    mode = 'revision',
    draftingRequestId = null,
    listFilters = {},
    entry = null,
    jobNumber = '',
    revisions = [],
    statusOptions = [],
    categoryOptions = [],
    defaultJobStatus = 'new',
    projectOptions = [],
}) {
    const isForwardMode = mode === 'forward';
    const { categoryOptions: pageCategoryOptions = [] } = usePage().props;
    const categories =
        categoryOptions.length > 0 ? categoryOptions : pageCategoryOptions;
    const needsProjectPick = !entry && !draftingRequestId;
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [forwarding, setForwarding] = useState(false);

    const emptyRevisions = useMemo(() => [], []);
    const selectedProject = useMemo(
        () =>
            projectOptions.find(
                (option) => String(option.id) === String(selectedProjectId),
            ) ?? null,
        [projectOptions, selectedProjectId],
    );

    const effectiveRequestId = draftingRequestId || selectedProject?.id || null;
    const effectiveJobNumber = draftingRequestId
        ? jobNumber
        : (selectedProject?.job_no ?? '');
    const effectiveRevisions = draftingRequestId
        ? revisions
        : (selectedProject?.revisions ?? emptyRevisions);
    const effectiveStatus = draftingRequestId
        ? defaultJobStatus || 'new'
        : (selectedProject?.status ?? defaultJobStatus) || 'new';

    const projectSelectOptions = useMemo(
        () =>
            projectOptions.map((option) => ({
                value: String(option.id),
                label: option.label,
            })),
        [projectOptions],
    );

    const categorySelectOptions = useMemo(() => {
        const items = categories
            .map((option) => {
                const code = String(option.code || '').trim();
                const name = String(option.name || '').trim();
                const value = code || name;

                return {
                    value,
                    label:
                        code && name && code !== name
                            ? `${code} — ${name}`
                            : name || code,
                };
            })
            .filter((option) => option.value !== '');

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
            setSelectedProjectId('');
            setForwarding(false);
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

        // Only refresh revision code + status when the selected project changes.
        // Keep category / date / link so a Select2 choice is not wiped.
        form.setData(
            'code',
            suggestNextRevisionCode(effectiveJobNumber, effectiveRevisions),
        );
        form.setData('status', effectiveStatus || 'new');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        show,
        entry,
        isForwardMode,
        effectiveJobNumber,
        effectiveRevisions,
        effectiveStatus,
        selectedProjectId,
    ]);

    const submit = (e) => {
        e.preventDefault();

        if (!effectiveRequestId) {
            return;
        }

        if (isForwardMode) {
            setForwarding(true);
            form.post(
                route('job.board.add.quick', effectiveRequestId),
                {
                    onSuccess: () => {
                        form.reset();
                        onClose();
                    },
                    onFinish: () => setForwarding(false),
                    onError: () => setForwarding(false),
                },
            );
            return;
        }

        if (isEditing) {
            form.patch(
                route('job.drafting.revisions.update', [
                    effectiveRequestId,
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
            route('job.drafting.revisions.store', effectiveRequestId) + listQs,
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
                    {isEditing
                        ? 'Edit item'
                        : isForwardMode
                          ? 'Add item'
                          : 'Add revision'}
                </h2>
                <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                    {isEditing
                        ? 'Update revision number, link, category, date in, and status. Drafter, hours, and date out are set on the board.'
                        : isForwardMode
                          ? 'Select a masterlist project (or reopenable board job), then review and add it to Project Management.'
                          : 'Add a revision. Assign drafter, checker, and hours on the Project Management board.'}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {needsProjectPick ? (
                        <div className="sm:col-span-2">
                            <InputLabel
                                htmlFor="revision-project"
                                value="Project"
                            />
                            <div className="mt-1 select2-field">
                                <Select2
                                    id="revision-project"
                                    value={selectedProjectId}
                                    onChange={setSelectedProjectId}
                                    options={projectSelectOptions}
                                    placeholder={
                                        projectSelectOptions.length === 0
                                            ? 'No projects available'
                                            : 'Select project…'
                                    }
                                    enabled={
                                        show && projectSelectOptions.length > 0
                                    }
                                    required
                                />
                            </div>
                            {projectSelectOptions.length === 0 ? (
                                <p className="mt-1 text-xs text-[#676879] dark:text-slate-400">
                                    {isForwardMode
                                        ? 'No masterlist projects are available to add. Encode a project on the masterlist first.'
                                        : 'No projects on this page allow adding a revision. Search or change pages, then try again.'}
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    {(!isForwardMode || selectedProjectId) ? (
                        <>
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
                                    readOnly={!isEditing && !isForwardMode}
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
                                <InputLabel
                                    htmlFor="revision-log-date"
                                    value="Date In"
                                />
                                <TextInput
                                    id="revision-log-date"
                                    type="date"
                                    value={form.data.log_date}
                                    onChange={(e) =>
                                        form.setData(
                                            'log_date',
                                            e.target.value,
                                        )
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
                                <InputLabel
                                    htmlFor="revision-status"
                                    value="Status"
                                />
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
                        </>
                    ) : null}
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
                        loading={isForwardMode ? forwarding : form.processing}
                        disabled={!effectiveRequestId && !isEditing}
                        className="rounded-lg normal-case tracking-normal"
                    >
                        {isEditing
                            ? 'Save item'
                            : isForwardMode
                              ? 'Add item'
                              : 'Add revision'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
