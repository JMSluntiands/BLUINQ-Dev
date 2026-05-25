import DataTable, { DataTableSortHeader } from '@/Components/DataTable';
import DraftingStatusBadge from '@/Components/DraftingStatusBadge';
import FlashNoticeModal from '@/Components/FlashNoticeModal';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import TableSearchToolbar from '@/Components/TableSearchToolbar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { createColumnHelper } from '@tanstack/react-table';
import { Head, router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

function listQueryString(filters = {}) {
    const p = new URLSearchParams();
    if (filters.search) {
        p.set('search', filters.search);
    }
    if (filters.per_page) {
        p.set('per_page', String(filters.per_page));
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

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

const columnHelper = createColumnHelper();

const restoreBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#676879] transition-colors hover:bg-[#e6e9ef] hover:text-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1';

const FLASH_MESSAGES = {
    'crm-quote-restored': 'Quote restored to the list.',
};

export default function QuoteArchive({
    quotes,
    filters = {},
    canViewAllQuotes = false,
}) {
    const rows = quotes?.data ?? [];
    const hasSearch = Boolean((filters.search ?? '').trim());
    const listQs = listQueryString(filters);
    const [restoreTarget, setRestoreTarget] = useState(null);

    const confirmRestore = useCallback(() => {
        if (!restoreTarget) {
            return;
        }
        router.post(
            route('crm.quotes.restore', restoreTarget.id) + listQs,
            {},
            { preserveScroll: true },
        );
        setRestoreTarget(null);
    }, [restoreTarget, listQs]);

    const columns = useMemo(
        () => [
            columnHelper.accessor('id', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        #
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="tabular-nums font-semibold text-[#323338]">
                        QDF-{String(getValue()).padStart(5, '0')}
                    </span>
                ),
            }),
            columnHelper.accessor('requested_at', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Date
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="whitespace-nowrap text-[#323338]">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('client_company_name', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Client / Company
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="font-medium text-[#323338]">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('site_address', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Site address
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span
                        className="line-clamp-2 max-w-xs text-[#323338]"
                        title={getValue()}
                    >
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor('status_label', {
                header: () => (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#676879]">
                        Status
                    </span>
                ),
                enableSorting: false,
                cell: ({ row, getValue }) => (
                    <DraftingStatusBadge
                        status={row.original.status}
                        label={getValue()}
                    />
                ),
            }),
            columnHelper.accessor('archived_at', {
                header: ({ column }) => (
                    <DataTableSortHeader column={column}>
                        Archived
                    </DataTableSortHeader>
                ),
                cell: ({ getValue }) => (
                    <span className="whitespace-nowrap text-[#676879]">
                        {formatArchivedAt(getValue())}
                    </span>
                ),
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
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setRestoreTarget({
                                    id: row.original.id,
                                    name: row.original.client_company_name,
                                });
                            }}
                            className={restoreBtn}
                            title="Restore"
                            aria-label={`Restore quote for ${row.original.client_company_name}`}
                        >
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                        </button>
                    </div>
                ),
            }),
        ],
        [listQs],
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold leading-tight text-[#323338]">
                            CRM — Quote archive
                        </h2>
                        <p className="mt-1 text-sm text-[#676879]">
                            {canViewAllQuotes
                                ? 'Archived quotes. Restore to return them to the active list.'
                                : 'Your archived quotes.'}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="CRM — Quote archive" />

            <FlashNoticeModal messages={FLASH_MESSAGES} />

            <Modal
                show={restoreTarget != null}
                onClose={() => setRestoreTarget(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-[#323338]">
                        Restore quote?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#676879]">
                        Quote for{' '}
                        <span className="font-medium text-[#323338]">
                            {restoreTarget?.name}
                        </span>{' '}
                        will return to the quote list.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setRestoreTarget(null)}
                            className="rounded-lg normal-case tracking-normal"
                        >
                            Cancel
                        </SecondaryButton>
                        <button
                            type="button"
                            onClick={confirmRestore}
                            className="inline-flex items-center rounded-lg bg-[#0073ea] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0060c4] focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:ring-offset-1"
                        >
                            Restore
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="overflow-hidden rounded-2xl border border-[#e6e9ef] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <TableSearchToolbar
                    key={`${filters.search ?? ''}-${filters.per_page}`}
                    ziggyRouteName="crm.quotes.archive"
                    filters={filters}
                />
                <DataTable
                    data={rows}
                    columns={columns}
                    emptyMessage={
                        hasSearch
                            ? 'No archived quotes match your search.'
                            : 'No archived quotes.'
                    }
                />
                <Pagination pagination={quotes} />
            </div>
        </AuthenticatedLayout>
    );
}
