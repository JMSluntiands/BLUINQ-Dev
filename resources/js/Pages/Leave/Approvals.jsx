import FileDropzone from '@/Components/FileDropzone';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import UserAvatar from '@/Components/UserAvatar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowDownTrayIcon,
    CheckCircleIcon,
    PencilSquareIcon,
    TrashIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { Head, router, useForm, usePage } from '@inertiajs/react';
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
    'leave-updated': 'Approved leave updated.',
    'leave-deleted': 'Approved leave deleted. Current-year credits were returned.',
    'leave-not-editable': 'Only approved leave can be edited or deleted.',
    'leave-already-reviewed': 'This request was already reviewed.',
    'leave-insufficient-credits':
        'Not enough leave credits for this change.',
};

function formatDayLabel(value) {
    return `${value} day${value === '1' ? '' : 's'}`;
}

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
                    {formatDayLabel(request.days_display)})
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {request.start_portion_label} to {request.end_portion_label}
                </p>
                {request.reason && (
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {request.reason}
                    </p>
                )}
                {request.has_attachment && request.attachment_url && (
                    <a
                        href={request.attachment_url}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        {request.attachment_name || 'Medical certificate'}
                    </a>
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

function holidayDatesForRegion(leaveHolidayConfig, region) {
    if (!region) {
        return [];
    }

    return Object.values(leaveHolidayConfig?.[region] ?? {}).flatMap((yearHolidays) =>
        Object.keys(yearHolidays ?? {}),
    );
}

function businessDayCount(startDate, endDate, holidayDates = []) {
    if (!startDate || !endDate) {
        return 0;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end < start
    ) {
        return 0;
    }

    const holidaySet = new Set(holidayDates);
    let total = 0;

    for (
        const cursor = new Date(start);
        cursor <= end;
        cursor.setDate(cursor.getDate() + 1)
    ) {
        const day = cursor.getDay();
        const dateKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        if (day === 0 || day === 6 || holidaySet.has(dateKey)) {
            continue;
        }
        total += 1;
    }

    return total;
}

function requestedDayCount(startDate, endDate, startPortion, endPortion, holidayDates) {
    const baseDays = businessDayCount(startDate, endDate, holidayDates);
    if (!baseDays) {
        return 0;
    }

    let total = baseDays;
    const holidaySet = new Set(holidayDates);
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T00:00:00`) : null;
    const startIsWorkingDay =
        start &&
        start.getDay() !== 0 &&
        start.getDay() !== 6 &&
        !holidaySet.has(startDate);
    const endIsWorkingDay =
        end &&
        end.getDay() !== 0 &&
        end.getDay() !== 6 &&
        !holidaySet.has(endDate);

    if (startPortion === 'afternoon' && startIsWorkingDay) {
        total -= 0.5;
    }

    if (endPortion === 'morning' && endIsWorkingDay) {
        total -= 0.5;
    }

    return Math.max(0.5, total);
}

function EditApprovedLeaveModal({ request, onClose }) {
    const { leaveTypes = [], leaveHolidayConfig = {} } = usePage().props;
    const types =
        leaveTypes.length > 0
            ? leaveTypes
            : [{ value: 'al', label: 'Annual Leave', code: 'AL' }];
    const { data, setData, patch, processing, errors } = useForm({
        start_date: request.start_date,
        end_date: request.end_date,
        start_portion: request.start_portion || 'morning',
        end_portion: request.end_portion || 'afternoon',
        type: request.type || 'al',
        reason: request.reason || '',
        medical_certificate: null,
    });
    const holidayDates = holidayDatesForRegion(
        leaveHolidayConfig,
        request.user?.holiday_region,
    );
    const dayCount = requestedDayCount(
        data.start_date,
        data.end_date,
        data.start_portion,
        data.end_portion,
        holidayDates,
    );
    const certificateAfterDays =
        types.find((type) => type.value === 'sl')
            ?.medical_certificate_after_days ?? 2;
    const needsCertificate =
        data.type === 'sl' &&
        dayCount > certificateAfterDays &&
        !request.has_attachment;

    const submit = (event) => {
        event.preventDefault();
        patch(route('leave.update', request.id), {
            preserveScroll: true,
            forceFormData: true,
            transform: (form) => {
                if (form.medical_certificate) {
                    return form;
                }

                const { medical_certificate, ...rest } = form;
                return rest;
            },
            onSuccess: () => onClose(),
        });
    };

    return (
        <Modal show onClose={onClose} maxWidth="lg">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Edit approved leave
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {request.user.name}. Saving updates the calendar. Credits
                    for the current leave year are adjusted to match.
                </p>

                <div className="mt-4 space-y-4">
                    <div>
                        <InputLabel htmlFor="edit_leave_type" value="Type" />
                        <select
                            id="edit_leave_type"
                            value={data.type}
                            onChange={(event) =>
                                setData('type', event.target.value)
                            }
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            {types.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.code} — {type.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.type} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="edit_start_date" value="Start date" />
                            <input
                                id="edit_start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(event) =>
                                    setData('start_date', event.target.value)
                                }
                                required
                                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            />
                            <InputError message={errors.start_date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit_end_date" value="End date" />
                            <input
                                id="edit_end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(event) =>
                                    setData('end_date', event.target.value)
                                }
                                required
                                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            />
                            <InputError message={errors.end_date} className="mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="edit_start_portion" value="Starts" />
                            <select
                                id="edit_start_portion"
                                value={data.start_portion}
                                onChange={(event) =>
                                    setData('start_portion', event.target.value)
                                }
                                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            >
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                            </select>
                            <InputError message={errors.start_portion} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit_end_portion" value="Ends" />
                            <select
                                id="edit_end_portion"
                                value={data.end_portion}
                                onChange={(event) =>
                                    setData('end_portion', event.target.value)
                                }
                                className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            >
                                <option value="morning">Morning</option>
                                <option value="afternoon">End of day</option>
                            </select>
                            <InputError message={errors.end_portion} className="mt-1" />
                        </div>
                    </div>

                    {dayCount > 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            This leave uses{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {dayCount}
                            </span>{' '}
                            working day{dayCount === 1 ? '' : 's'}.
                        </p>
                    )}

                    <div>
                        <InputLabel
                            htmlFor="edit_attachment"
                            value={
                                needsCertificate
                                    ? 'Medical certificate'
                                    : 'Replace attachment'
                            }
                        />
                        {request.has_attachment && (
                            <a
                                href={request.attachment_url}
                                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-600 dark:text-sky-300"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                {request.attachment_name || 'Current file'}
                            </a>
                        )}
                        <FileDropzone
                            id="edit_attachment"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            className="mt-1"
                            required={needsCertificate}
                            value={data.medical_certificate}
                            onChange={(file) =>
                                setData('medical_certificate', file)
                            }
                        />
                        <InputError
                            message={errors.attachment ?? errors.medical_certificate}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="edit_reason" value="Reason" />
                        <textarea
                            id="edit_reason"
                            value={data.reason}
                            onChange={(event) =>
                                setData('reason', event.target.value)
                            }
                            rows={3}
                            required
                            className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <InputError message={errors.reason} className="mt-1" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={processing}>
                        Save changes
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
    const [editTarget, setEditTarget] = useState(null);

    const deleteApprovedLeave = (request) => {
        const confirmed = window.confirm(
            `Delete the approved ${request.type_label} for ${request.user.name} (${request.start_display} – ${request.end_display})? Credits deducted for the current leave year will be returned.`,
        );
        if (!confirmed) {
            return;
        }

        router.delete(route('leave.destroy', request.id), {
            preserveScroll: true,
        });
    };

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
                                        {request.end_display} ·{' '}
                                        {formatDayLabel(request.days_display)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                        {request.start_portion_label} to{' '}
                                        {request.end_portion_label}
                                    </p>
                                    {request.reason && (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {request.reason}
                                        </p>
                                    )}
                                    {request.has_attachment &&
                                        request.attachment_url && (
                                            <a
                                                href={request.attachment_url}
                                                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200"
                                            >
                                                <ArrowDownTrayIcon className="h-4 w-4" />
                                                Medical certificate
                                            </a>
                                        )}
                                    {request.status === 'pending' &&
                                        request.deducts_credits && (
                                            <p
                                                className={
                                                    'mt-1 text-xs font-medium ' +
                                                    (request.has_enough_credits
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-rose-600 dark:text-rose-400')
                                                }
                                            >
                                                {request.type_code}: AL{' '}
                                                {request.user.balances
                                                    ?.al_available ??
                                                    request.user
                                                        .leave_credits}{' '}
                                                · SL{' '}
                                                {request.user.balances
                                                    ?.sl_credits ?? 0}{' '}
                                                · Medical{' '}
                                                {request.user.balances
                                                    ?.medical_remaining ?? 0}{' '}
                                                · Needs{' '}
                                                {request.credits_required}
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
                                {request.status === 'approved' && (
                                    <div className="flex shrink-0 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditTarget(request)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteApprovedLeave(request)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                            Delete
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

            {editTarget && (
                <EditApprovedLeaveModal
                    key={editTarget.id}
                    request={editTarget}
                    onClose={() => setEditTarget(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
