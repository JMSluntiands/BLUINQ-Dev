import DataTable, { DataTableSortHeader } from '@/Components/DataTable';
import MondayStatusBadge from '@/Components/MondayStatusBadge';
import Pagination from '@/Components/Pagination';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { createColumnHelper } from '@tanstack/react-table';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

const columnHelper = createColumnHelper();

function formatArchivedAt(value) {
    if (!value) {
        return '—';
    }
    try {
        return new Date(value).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return value;
    }
}

function filterQueryString(filters) {
    const p = new URLSearchParams();
    if (filters?.search) {
        p.set('search', filters.search);
    }
    if (filters?.per_page) {
        p.set('per_page', String(filters.per_page));
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

const restoreBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1';

const FLASH_MESSAGES = {
    'client-restored': 'Client restored to the list.',
};

export default function ClientArchive({ clients, filters = {} }) {
    const rows = clients?.data ?? [];
    const hasSearch = Boolean((filters.search ?? '').trim());
    const q = filterQueryString(filters);
    const [restoreTarget, setRestoreTarget] = useState(null);

    const confirmRestore = useCallback(() => {
        if (!restoreTarget) {
            return;
        }
        router.post(
            route('settings.client.restore', restoreTarget.id) + q,
            {},
            { preserveScroll: true },
        );
        setRestoreTarget(null);
    }, [restoreTarget, q]);

    const columns = useMemo(
        () => [
            columnHelper.accessor('name', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Client name
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="font-medium text-[#323338]">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('status', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Status
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <MondayStatusBadge value={getValue()} />
                ),
            }),
            columnHelper.accessor('archived_at', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Archived
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => formatArchivedAt(getValue()),
            }),
            columnHelper.display({
                id: 'actions',
                enableSorting: false,
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                        Actions
                    </span>
                ),
                meta: { align: 'right' },
                cell: ({ row }) => {
                    const r = row.original;
                    return (
                        <div className="flex flex-wrap items-center justify-end gap-0.5">
                            <button
                                type="button"
                                onClick={() =>
                                    setRestoreTarget({
                                        id: r.id,
                                        name: r.name,
                                    })
                                }
                                className={restoreBtn}
                                title="Restore"
                                aria-label={`Restore ${r.name}`}
                            >
                                <ArrowUturnLeftIcon className="h-5 w-5" />
                            </button>
                        </div>
                    );
                },
            }),
        ],
        [],
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-[#323338] dark:text-slate-100">
                        Clients — Archive
                    </h2>
                    <Link
                        href={route('settings.client.index') + q}
                        className="inline-flex items-center rounded-lg border border-[#c5c7d0] bg-white px-3 py-2 text-sm font-semibold text-[#323338] shadow-sm transition hover:bg-[#f6f7fb] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="Clients — Archive" />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <Modal
                show={restoreTarget != null}
                onClose={() => setRestoreTarget(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338]">
                        Restore client?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                        <span className="font-medium text-[#323338]">
                            “{restoreTarget?.name}”
                        </span>{' '}
                        will return to the active list.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setRestoreTarget(null)}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <SecondaryButton
                            type="button"
                            onClick={confirmRestore}
                            className="rounded-lg normal-case tracking-normal !bg-[#0073ea] !text-white hover:!bg-[#0060c4]"
                        >
                            Restore
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>

            <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-[#e6e9ef] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <TableSearchToolbar
                        key={`${filters.search ?? ''}-${filters.per_page}`}
                        ziggyRouteName="settings.client.archive"
                        filters={filters}
                    />
                    <DataTable
                        data={rows}
                        columns={columns}
                        emptyMessage={
                            hasSearch
                                ? 'No archived clients match your search.'
                                : 'No archived clients.'
                        }
                    />
                    <Pagination pagination={clients} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
