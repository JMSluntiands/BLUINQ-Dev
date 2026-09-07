import Pagination from '@/Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import UserAvatar from '@/Components/UserAvatar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

const STATUS_STYLES = {
    no_clock_in:
        'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
    no_clock_out:
        'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
    clocked_out:
        'bg-slate-100 text-slate-700 dark:bg-slate-600/40 dark:text-slate-200',
};

const STATUS_LABELS = {
    no_clock_in: 'No clock in',
    no_clock_out: 'No clock out',
    clocked_out: 'Clocked out',
};

function StatusBadge({ status }) {
    return (
        <span
            className={
                'inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ' +
                (STATUS_STYLES[status] ?? STATUS_STYLES.no_clock_in)
            }
        >
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

export default function History({ records, filters = {}, timezone }) {
    const rows = records?.data ?? [];

    const handleFilter = (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);

        router.get(
            route('attendance.history'),
            {
                search: form.get('search') || undefined,
                from: form.get('from') || undefined,
                to: form.get('to') || undefined,
                per_page: form.get('per_page') || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800 dark:text-slate-100">
                    Clock in / out history
                </h2>
            }
        >
            <Head title="Clock in / out history" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                    Staff attendance records
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Times shown in {timezone || 'Asia/Manila'}
                                </p>
                            </div>

                            <form
                                onSubmit={handleFilter}
                                className="flex flex-wrap items-end gap-2"
                            >
                                <label className="block">
                                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        From
                                    </span>
                                    <input
                                        type="date"
                                        name="from"
                                        defaultValue={filters.from ?? ''}
                                        className="rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        To
                                    </span>
                                    <input
                                        type="date"
                                        name="to"
                                        defaultValue={filters.to ?? ''}
                                        className="rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Search
                                    </span>
                                    <input
                                        type="search"
                                        name="search"
                                        defaultValue={filters.search ?? ''}
                                        placeholder="Employee name..."
                                        className="w-44 rounded-lg border-slate-300 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                </label>
                                <input
                                    type="hidden"
                                    name="per_page"
                                    value={filters.per_page ?? 25}
                                />
                                <SecondaryButton type="submit">
                                    Apply
                                </SecondaryButton>
                            </form>
                        </div>

                        {rows.length === 0 ? (
                            <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                No clock records found for this range.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                    <thead className="bg-slate-50/80 dark:bg-slate-800/50">
                                        <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            <th className="px-5 py-3">
                                                Employee
                                            </th>
                                            <th className="px-5 py-3">Date</th>
                                            <th className="px-5 py-3">
                                                Clock in
                                            </th>
                                            <th className="px-5 py-3">
                                                Clock out
                                            </th>
                                            <th className="px-5 py-3">
                                                Duration
                                            </th>
                                            <th className="px-5 py-3">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="text-sm text-slate-700 dark:text-slate-200"
                                            >
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar
                                                            user={row.user}
                                                            className="h-9 w-9 text-xs"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-slate-900 dark:text-white">
                                                                {row.user?.name}
                                                            </p>
                                                            {row.user
                                                                ?.department && (
                                                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                    {
                                                                        row.user
                                                                            .department
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-3">
                                                    {row.work_date_display}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-3">
                                                    {row.clock_in_time ?? '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-3">
                                                    {row.clock_out_time ?? '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-3">
                                                    {row.duration_label ?? '—'}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <StatusBadge
                                                        status={row.status}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {records && (
                            <Pagination pagination={records} />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
