import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
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

const KIND_CONFIG = {
    quote: {
        kind: 'quote',
        title: 'Add quote',
        editTitle: 'Edit quote',
        numberLabel: 'Quote #',
        numberPlaceholder: 'e.g. Q-1042',
        submitLabel: 'Add quote',
        editSubmitLabel: 'Save quote',
        defaultStatuses: [
            'QUOTE SENT',
            'DECLINED',
            'ACCEPTED',
            'REVISED',
        ],
    },
    invoice: {
        kind: 'invoice',
        title: 'Add invoice',
        editTitle: 'Edit invoice',
        numberLabel: 'Invoice #',
        numberPlaceholder: 'e.g. INV-2091',
        submitLabel: 'Add invoice',
        editSubmitLabel: 'Save invoice',
        defaultStatuses: ['INVOICED', 'PAID'],
    },
};

const selectClass =
    'mt-1 block w-full rounded-md border-[#c5c7d0] text-sm shadow-sm focus:border-[#0073ea] focus:ring-[#0073ea] dark:border-[#3b82f6]/40 dark:bg-[#1a1b2e] dark:text-slate-200';

export default function DraftingAccountAddModal({
    show = false,
    onClose,
    draftingRequestId,
    listFilters = {},
    accountKind = 'quote',
    entry = null,
    statusOptions = null,
}) {
    const config = KIND_CONFIG[accountKind] ?? KIND_CONFIG.quote;
    const listQs = listQueryString(listFilters);
    const isEditing = entry != null;
    const { accountStatusOptions: pageStatusOptions = {} } = usePage().props;

    const statuses = useMemo(() => {
        const fromProp =
            statusOptions ??
            pageStatusOptions?.[config.kind] ??
            config.defaultStatuses;

        const list = Array.isArray(fromProp) ? [...fromProp] : [];

        if (entry?.status && !list.includes(entry.status)) {
            list.unshift(entry.status);
        }

        return list;
    }, [statusOptions, pageStatusOptions, config.kind, entry?.status]);

    const form = useForm({
        kind: config.kind,
        number: '',
        category: '',
        rate: '',
        status: '',
    });

    useEffect(() => {
        if (!show) {
            form.reset();
            form.clearErrors();
            return;
        }

        form.setData('kind', config.kind);

        if (entry) {
            form.setData({
                kind: config.kind,
                number: entry.number ?? '',
                category: entry.category ?? '',
                rate: entry.rate ?? '',
                status: entry.status ?? '',
            });
        } else {
            form.setData({
                kind: config.kind,
                number: '',
                category: '',
                rate: '',
                status: statuses[0] ?? '',
            });
        }
    }, [show, accountKind, entry]);

    const submit = (e) => {
        e.preventDefault();

        if (isEditing) {
            form.patch(
                route('job.drafting.accounts.update', [
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
            route('job.drafting.accounts.store', draftingRequestId) + listQs,
            {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    form.setData('kind', config.kind);
                    onClose();
                },
            },
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-[#323338] dark:text-white">
                    {isEditing ? config.editTitle : config.title}
                </h2>
                <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                    {isEditing
                        ? `Update this ${config.kind} entry for this job.`
                        : `Link a new ${config.kind} to this job. It will appear in the table and activity log.`}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel
                            htmlFor="account-number"
                            value={config.numberLabel}
                        />
                        <TextInput
                            id="account-number"
                            value={form.data.number}
                            onChange={(e) =>
                                form.setData('number', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder={config.numberPlaceholder}
                            required
                        />
                        <InputError
                            message={form.errors.number}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="account-category"
                            value="Category"
                        />
                        <TextInput
                            id="account-category"
                            value={form.data.category}
                            onChange={(e) =>
                                form.setData('category', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="e.g. DRAFTING"
                            required
                        />
                        <InputError
                            message={form.errors.category}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="account-status" value="Status" />
                        <select
                            id="account-status"
                            className={selectClass}
                            value={form.data.status}
                            onChange={(e) =>
                                form.setData('status', e.target.value)
                            }
                            required
                        >
                            <option value="">Select…</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={form.errors.status}
                            className="mt-1"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="account-rate" value="Rate" />
                        <TextInput
                            id="account-rate"
                            value={form.data.rate}
                            onChange={(e) =>
                                form.setData('rate', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="e.g. 1200"
                        />
                        <InputError
                            message={form.errors.rate}
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
                        {isEditing ? config.editSubmitLabel : config.submitLabel}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
