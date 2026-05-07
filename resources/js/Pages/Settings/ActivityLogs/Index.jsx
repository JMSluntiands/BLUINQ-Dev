import Pagination from '@/Components/Pagination';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

function formatWhen(iso) {
    if (!iso) {
        return '—';
    }
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return iso;
    }
}

function methodBadgeClass(method) {
    switch (method) {
        case 'POST':
            return 'bg-emerald-100 text-emerald-800';
        case 'PATCH':
        case 'PUT':
            return 'bg-sky-100 text-sky-800';
        case 'DELETE':
            return 'bg-rose-100 text-rose-800';
        default:
            return 'bg-slate-100 text-slate-700';
    }
}

export default function ActivityLogsIndex({ logs, filters = {} }) {
    const rows = logs?.data ?? [];
    const perPage = filters.per_page ?? 25;

    const onPerPageChange = (e) => {
        const next = Number(e.target.value);
        router.get(
            route('settings.activity-logs.index'),
            { per_page: next },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-[#323338]">
                    Activity logs
                </h2>
            }
        >
            <Head title="Activity logs" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[#676879]">
                        Successful saves, updates, archives, and other write
                        actions (web and API) are recorded here.
                    </p>
                    <label className="flex items-center gap-2 text-sm text-[#323338]">
                        <span className="text-[#676879]">Rows per page</span>
                        <select
                            value={perPage}
                            onChange={onPerPageChange}
                            className="rounded-lg border border-[#c5c7d0] bg-white px-2 py-1.5 text-sm font-medium text-[#323338] shadow-sm focus:border-[#0073ea] focus:outline-none focus:ring-1 focus:ring-[#0073ea]"
                        >
                            {[10, 25, 50, 100].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#e6e9ef] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#e6e9ef] text-left text-sm">
                            <thead className="bg-[#fafbfc]">
                                <tr>
                                    <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        When
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        User
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        Method
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        Route
                                    </th>
                                    <th className="min-w-[12rem] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        Path
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e6e9ef]">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-[#676879]"
                                        >
                                            No activity recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="bg-white hover:bg-[#fafbfc]/80"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 text-[#323338]">
                                                {formatWhen(row.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.user ? (
                                                    <div>
                                                        <div className="font-medium text-[#323338]">
                                                            {row.user.name}
                                                        </div>
                                                        <div className="text-xs text-[#676879]">
                                                            {row.user.email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[#676879]">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span
                                                    className={
                                                        'inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ' +
                                                        methodBadgeClass(
                                                            row.method,
                                                        )
                                                    }
                                                >
                                                    {row.method}
                                                </span>
                                            </td>
                                            <td className="max-w-[14rem] truncate px-4 py-3 font-mono text-xs text-[#323338]">
                                                {row.route_name ?? '—'}
                                            </td>
                                            <td className="max-w-xl px-4 py-3 font-mono text-xs text-[#676879]">
                                                <span
                                                    className="break-all"
                                                    title={row.path}
                                                >
                                                    {row.path}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-[#323338]">
                                                {row.status_code}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination pagination={logs} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
