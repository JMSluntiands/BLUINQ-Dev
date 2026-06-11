import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

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

const selectClass =
    'mt-1 block w-full rounded-md border border-[#c5c7d0] bg-white px-3 py-2 text-sm text-[#323338] shadow-sm focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea] dark:border-[#2f3347] dark:bg-[#151622] dark:text-slate-200 dark:focus:border-[#3b82f6] dark:focus:ring-[#3b82f6]';

export default function DraftingRevisionAddModal({
    show = false,
    onClose,
    draftingRequestId,
    listFilters = {},
    drafterUsers = [],
}) {
    const { auth } = usePage().props;
    const listQs = listQueryString(listFilters);

    const form = useForm({
        code: '',
        log_date: '',
        category: '',
        drafter_user_id: '',
        hours: '',
        submitted_date: '',
    });

    useEffect(() => {
        if (!show) {
            form.reset();
            form.clearErrors();
            return;
        }

        const currentUserId = auth?.user?.id;
        if (
            currentUserId &&
            drafterUsers.some((user) => user.id === currentUserId)
        ) {
            form.setData('drafter_user_id', String(currentUserId));
        }
    }, [show, auth?.user?.id, drafterUsers]);

    const submit = (e) => {
        e.preventDefault();
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
                    Add revision
                </h2>
                <p className="mt-1 text-sm text-[#676879] dark:text-slate-400">
                    Record a new revision entry. This will appear in the
                    revision table and activity log.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="revision-code" value="Revision code" />
                        <TextInput
                            id="revision-code"
                            value={form.data.code}
                            onChange={(e) =>
                                form.setData('code', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="e.g. B26001-01"
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
                        <InputLabel htmlFor="revision-category" value="Category" />
                        <TextInput
                            id="revision-category"
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
                        <InputLabel htmlFor="revision-user" value="User" />
                        <select
                            id="revision-user"
                            value={form.data.drafter_user_id}
                            onChange={(e) =>
                                form.setData('drafter_user_id', e.target.value)
                            }
                            className={selectClass}
                            required
                        >
                            <option value="">Select user…</option>
                            {drafterUsers.map((user) => (
                                <option key={user.id} value={String(user.id)}>
                                    {user.name}
                                    {user.initials
                                        ? ` (${user.initials})`
                                        : ''}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={form.errors.drafter_user_id}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="revision-hours" value="Hours" />
                        <TextInput
                            id="revision-hours"
                            type="number"
                            min="0"
                            step="0.25"
                            value={form.data.hours}
                            onChange={(e) =>
                                form.setData('hours', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder="Optional"
                        />
                        <InputError
                            message={form.errors.hours}
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
                        Add revision
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
