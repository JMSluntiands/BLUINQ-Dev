import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import UserAvatar from '@/Components/UserAvatar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_TABS = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
];

const FLASH_MESSAGES = {
    'leave-approved': 'Leave request approved.',
    'leave-rejected': 'Leave request rejected.',
    'leave-already-reviewed': 'This request was already reviewed.',
    'leave-insufficient-credits':
        'Cannot approve — employee does not have enough leave credits.',
};

function StatusBadge({ status }) {
    const styles = {
        pending:
            'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
        approved:
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
        rejected:
            'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
    };

    return (
        <span
            className={
                'inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize ' +
                (styles[status] ?? styles.pending)
            }
        >
            {status}
        </span>
    );
}

function ReviewModal({ request, action, onClose }) {
    const { data, setData, post, processing, reset } = useForm({
        admin_notes: '',
    });

    const isApprove = action === 'approve';
    const routeName = isApprove ? 'leave.approve' : 'leave.reject';

    const submit = (event) => {
        event.preventDefault();
        post(route(routeName, request.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {isApprove ? 'Approve' : 'Reject'} leave request
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {request.user.name} · {request.type_label} ·{' '}
                    {request.start_display} – {request.end_display} (
                    {request.days} day{request.days !== 1 ? 's' : ''})
                </p>
                {request.reason && (
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {request.reason}
                    </p>
                )}

                <div className="mt-4">
                    <label
                        htmlFor="admin_notes"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                        Notes (optional)
                    </label>
                    <textarea
                        id="admin_notes"
                        value={data.admin_notes}
                        onChange={(event) =>
                            setData('admin_notes', event.target.value)
                        }
                        rows={2}
                        className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton
                        disabled={processing}
                        className={
                            isApprove
                                ? ''
                                : '!bg-rose-600 hover:!bg-rose-500 focus:!bg-rose-600 focus:!ring-rose-500'
                        }
                    >
                        {isApprove ? 'Approve' : 'Reject'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}

export default function Approvals({
    requests,
    filters = {},
    pendingCount = 0,
}) {
    const rows = requests?.data ?? [];
    const [reviewTarget, setReviewTarget] = useState(null);

    const setStatusFilter = (status) => {
        router.get(
            route('leave.approvals'),
            { status, search: filters.search ?? '' },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        router.get(
            route('leave.approvals'),
            {
                status: filters.status ?? 'pending',
                search: formData.get('search') ?? '',
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                        Leave approvals
                    </h2>
                    {pendingCount > 0 && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                            {pendingCount} pending
                        </span>
                    )}
                </div>
            }
        >
            <Head title="Leave approvals" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <div className="flex flex-wrap gap-1">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setStatusFilter(tab.key)}
                                className={
                                    'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
                                    (filters.status === tab.key
                                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800')
                                }
                            >
                                {tab.label}
                                {tab.key === 'pending' && pendingCount > 0 && (
                                    <span className="ml-1.5 text-xs">
                                        ({pendingCount})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="search"
                            name="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search employee..."
                            className="rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <SecondaryButton type="submit">Search</SecondaryButton>
                    </form>
                </div>

                {rows.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        No leave requests found.
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rows.map((request) => (
                            <li
                                key={request.id}
                                className="flex flex-wrap items-center gap-4 px-5 py-4"
                            >
                                <UserAvatar
                                    user={request.user}
                                    className="h-10 w-10 text-sm"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {request.user.name}
                                        </p>
                                        <StatusBadge status={request.status} />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {request.type_label}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                                        {request.start_display} –{' '}
                                        {request.end_display} · {request.days}{' '}
                                        day{request.days !== 1 ? 's' : ''}
                                    </p>
                                    {request.reason && (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {request.reason}
                                        </p>
                                    )}
                                    {request.status === 'pending' &&
                                        request.type === 'leave' && (
                                            <p
                                                className={
                                                    'mt-1 text-xs font-medium ' +
                                                    (request.has_enough_credits
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-rose-600 dark:text-rose-400')
                                                }
                                            >
                                                Credits:{' '}
                                                {request.user.leave_credits} ·
                                                Needs {request.credits_required}
                                                {request.has_enough_credits
                                                    ? ''
                                                    : ' (insufficient)'}
                                            </p>
                                        )}
                                    {request.reviewed_by && (
                                        <p className="mt-1 text-xs text-slate-400">
                                            Reviewed by {request.reviewed_by}{' '}
                                            on {request.reviewed_at}
                                        </p>
                                    )}
                                </div>

                                {request.status === 'pending' && (
                                    <div className="flex shrink-0 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setReviewTarget({
                                                    request,
                                                    action: 'approve',
                                                })
                                            }
                                            disabled={
                                                request.type === 'leave' &&
                                                !request.has_enough_credits
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <CheckCircleIcon className="h-4 w-4" />
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setReviewTarget({
                                                    request,
                                                    action: 'reject',
                                                })
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                        >
                                            <XCircleIcon className="h-4 w-4" />
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {requests?.links?.length > 3 && (
                    <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                        <Pagination links={requests.links} />
                    </div>
                )}
            </div>

            {reviewTarget && (
                <ReviewModal
                    request={reviewTarget.request}
                    action={reviewTarget.action}
                    onClose={() => setReviewTarget(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
