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
    { key: 'declined', label: 'Declined' },
    { key: 'all', label: 'All' },
];

const FLASH_MESSAGES = {
    'password-change-approved': 'Password change approved.',
    'password-change-declined': 'Password change declined.',
    'password-change-already-reviewed': 'This request was already reviewed.',
};

function StatusBadge({ status }) {
    const styles = {
        pending:
            'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
        approved:
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
        declined:
            'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
        cancelled:
            'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
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
    const routeName = isApprove
        ? 'settings.password-requests.approve'
        : 'settings.password-requests.decline';

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
                    {isApprove ? 'Approve' : 'Decline'} password change
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {request.user.name} · {request.user.email}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Requested on {request.created_at}.
                </p>

                <div className="mt-4">
                    <label
                        htmlFor="admin_notes"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        Notes (optional)
                    </label>
                    <textarea
                        id="admin_notes"
                        value={data.admin_notes}
                        onChange={(event) =>
                            setData('admin_notes', event.target.value)
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        placeholder="Optional note for the employee..."
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
                                : 'bg-rose-600 hover:bg-rose-500 focus:bg-rose-600'
                        }
                    >
                        {isApprove ? 'Approve' : 'Decline'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}

export default function Index({ requests, filters = {} }) {
    const rows = requests?.data ?? [];
    const [reviewTarget, setReviewTarget] = useState(null);
    const [reviewAction, setReviewAction] = useState('approve');

    const openReview = (request, action) => {
        setReviewTarget(request);
        setReviewAction(action);
    };

    const closeReview = () => {
        setReviewTarget(null);
    };

    const changeTab = (status) => {
        router.get(
            route('settings.password-requests.index'),
            { status },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                    Password change requests
                </h2>
            }
        >
            <Head title="Password change requests" />
            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
                <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => changeTab(tab.key)}
                            className={
                                'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
                                (filters.status === tab.key
                                    ? 'bg-sky-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
                            }
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {rows.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        No password change requests found.
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
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {request.user.position
                                            ? `${request.user.position} · `
                                            : ''}
                                        {request.user.email}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                        Requested {request.created_at}
                                        {request.reviewed_at
                                            ? ` · Reviewed ${request.reviewed_at}${
                                                  request.reviewer_name
                                                      ? ` by ${request.reviewer_name}`
                                                      : ''
                                              }`
                                            : ''}
                                    </p>
                                    {request.admin_notes?.trim() && (
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Note: {request.admin_notes}
                                        </p>
                                    )}
                                </div>
                                {request.status === 'pending' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openReview(request, 'approve')
                                            }
                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                                        >
                                            <CheckCircleIcon className="h-4 w-4" />
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openReview(request, 'decline')
                                            }
                                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                        >
                                            <XCircleIcon className="h-4 w-4" />
                                            Decline
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
                    request={reviewTarget}
                    action={reviewAction}
                    onClose={closeReview}
                />
            )}
        </AuthenticatedLayout>
    );
}
